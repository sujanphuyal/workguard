import { parse } from 'date-fns';

import type { ShiftSchedulePreset } from '@/types';

export function createEmptyShiftSchedulePreset(employerId: string): ShiftSchedulePreset {
  return {
    id: '',
    employerId,
    label: '',
    startTime: '09:00',
    endTime: '17:00',
  };
}

export function formatScheduleClock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function parseScheduleClock(value: string): Date {
  const trimmed = value.trim();
  const parsed24 = parse(trimmed, 'HH:mm', new Date());
  if (!Number.isNaN(parsed24.getTime())) return parsed24;
  const parsed12 = parse(trimmed, 'h:mm a', new Date());
  if (!Number.isNaN(parsed12.getTime())) return parsed12;
  const fallback = new Date();
  fallback.setHours(9, 0, 0, 0);
  return fallback;
}

export function getScheduleInitials(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0]!.charAt(0).toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

export function parseShiftSchedulesJson(raw: string | null | undefined): ShiftSchedulePreset[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ShiftSchedulePreset[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        typeof item?.id === 'string' &&
        typeof item?.employerId === 'string' &&
        typeof item?.label === 'string' &&
        typeof item?.startTime === 'string' &&
        typeof item?.endTime === 'string',
    );
  } catch {
    return [];
  }
}

export function serializeShiftSchedules(presets: ShiftSchedulePreset[]): string {
  return JSON.stringify(presets);
}

export function filterShiftSchedulesForEmployer(
  presets: ShiftSchedulePreset[],
  employerId: string | undefined,
): ShiftSchedulePreset[] {
  if (!employerId) return [];
  return presets.filter((preset) => preset.employerId === employerId);
}
