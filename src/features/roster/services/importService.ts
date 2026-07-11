import { parse } from 'date-fns';

import * as Crypto from 'expo-crypto';

import { DEFAULT_BREAK_MINUTES } from '@/constants';
import { validateShift, simulateRoster } from '@/rules/VisaRuleEngine';
import type { Shift, ShiftStatus, UserContext } from '@/types';
import { combineDateAndTime, inferShiftStatus } from '@/utils/shifts';
import { calculateNetDurationMinutes } from '@/utils/time';

export const IMPORT_CSV_HEADER =
  'Employer,Date,StartTime,EndTime,BreakMinutes,Status,Notes';

export const IMPORT_CSV_EXAMPLE = `${IMPORT_CSV_HEADER}
Cafe ABC,2026-07-15,09:00,17:00,30,scheduled,
Retail Co,2026-07-16,14:00,18:00,30,,`;

export interface ImportRow {
  employer: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  status?: ShiftStatus;
  notes?: string;
}

export interface ImportPreview {
  rows: ImportRow[];
  importable: number;
  duplicates: number;
  overlaps: number;
  invalid: number;
  unmatchedEmployers: string[];
  complianceStatus: 'compliant' | 'warning' | 'violation';
  projectedHours: number;
}

/** Normalise employer names so CSV matching ignores case and surrounding spaces. */
export function normalizeEmployerName(name: string): string {
  return name.trim().toLowerCase();
}

export function buildEmployerLookup(
  employers: { id: string; name: string }[],
): Record<string, string> {
  return Object.fromEntries(
    employers.map((e) => [normalizeEmployerName(e.name), e.id]),
  );
}

export function lookupEmployerId(
  employerMap: Record<string, string>,
  employer: string,
): string | undefined {
  return employerMap[normalizeEmployerName(employer)];
}

const SHIFT_STATUSES: ShiftStatus[] = ['scheduled', 'worked', 'cancelled', 'missed'];

function parseClockTime(value: string): Date {
  const trimmed = value.trim();
  const parsed24 = parse(trimmed, 'HH:mm', new Date());
  if (!Number.isNaN(parsed24.getTime())) return parsed24;
  const parsed12 = parse(trimmed, 'h:mm a', new Date());
  if (!Number.isNaN(parsed12.getTime())) return parsed12;
  throw new Error(`Invalid time: ${value}`);
}

function parseShiftDate(value: string): Date {
  const trimmed = value.trim();
  const iso = parse(trimmed, 'yyyy-MM-dd', new Date());
  if (!Number.isNaN(iso.getTime())) return iso;
  const dmy = parse(trimmed, 'dd/MM/yyyy', new Date());
  if (!Number.isNaN(dmy.getTime())) return dmy;
  throw new Error(`Invalid date: ${value}`);
}

function parseStatus(value: string | undefined): ShiftStatus | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase() as ShiftStatus;
  return SHIFT_STATUSES.includes(normalized) ? normalized : undefined;
}

function parseRow(line: string): ImportRow | null {
  const parts = line.split(',').map((p) => p.trim());
  if (parts.length < 4) return null;

  const breakRaw = parts[4];
  let breakMinutes = DEFAULT_BREAK_MINUTES;
  if (breakRaw !== undefined && breakRaw !== '') {
    const parsed = parseInt(breakRaw, 10);
    breakMinutes = Number.isNaN(parsed) ? DEFAULT_BREAK_MINUTES : parsed;
  }

  return {
    employer: parts[0]!,
    date: parts[1]!,
    startTime: parts[2]!,
    endTime: parts[3]!,
    breakMinutes,
    status: parseStatus(parts[5]),
    notes: parts[6] || undefined,
  };
}

export function resolveImportRowTimes(row: ImportRow): {
  startTime: Date;
  endTime: Date;
  breakMinutes: number;
  status: ShiftStatus;
} {
  const shiftDate = parseShiftDate(row.date);
  const startTime = combineDateAndTime(shiftDate, parseClockTime(row.startTime));
  let endTime = combineDateAndTime(shiftDate, parseClockTime(row.endTime));
  if (endTime <= startTime) {
    endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
  }
  const breakMinutes = Math.max(0, row.breakMinutes);
  const status = row.status ?? inferShiftStatus(startTime);
  return { startTime, endTime, breakMinutes, status };
}

export function parseCsv(text: string): ImportRow[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const dataLines = lines.length > 0 && lines[0]!.toLowerCase().includes('employer') ? lines.slice(1) : lines;

  return dataLines.map(parseRow).filter((r): r is ImportRow => r !== null);
}

function draftShiftFromRow(row: ImportRow, userId: string, employerId: string): Shift {
  const { startTime, endTime, breakMinutes, status } = resolveImportRowTimes(row);
  const durationMinutes = calculateNetDurationMinutes(startTime, endTime, breakMinutes);
  const now = new Date();
  return {
    id: Crypto.randomUUID(),
    userId,
    employerId,
    status,
    startTime,
    endTime,
    durationMinutes,
    breakMinutes,
    notes: row.notes,
    createdAt: now,
    updatedAt: now,
  };
}

export function previewImport(
  rows: ImportRow[],
  existingShifts: Shift[],
  context: UserContext,
  employerMap: Record<string, string>,
  userId: string,
): ImportPreview {
  let duplicates = 0;
  let overlaps = 0;
  let invalid = 0;
  let importable = 0;
  const unmatchedEmployers = new Set<string>();
  const simulated = [...existingShifts];

  for (const row of rows) {
    const employerId = lookupEmployerId(employerMap, row.employer);
    if (!employerId) {
      unmatchedEmployers.add(row.employer.trim() || '(blank)');
      continue;
    }

    let draft: Shift;
    try {
      draft = draftShiftFromRow(row, userId, employerId);
    } catch {
      invalid += 1;
      continue;
    }

    const errors = validateShift(draft, simulated, context);
    if (errors.some((e) => e.code === 'duplicate')) duplicates += 1;
    if (errors.some((e) => e.code === 'overlap')) overlaps += 1;
    if (errors.length === 0) {
      simulated.push(draft);
      importable += 1;
    }
  }

  const forecast = simulateRoster(simulated, context);
  return {
    rows,
    importable,
    duplicates,
    overlaps,
    invalid,
    unmatchedEmployers: [...unmatchedEmployers],
    complianceStatus: forecast.status,
    projectedHours: forecast.projectedHours,
  };
}

export function importRowToShiftInput(row: ImportRow) {
  const { startTime, endTime, breakMinutes, status } = resolveImportRowTimes(row);
  return {
    startTime,
    endTime,
    breakMinutes,
    status,
    notes: row.notes,
  };
}
