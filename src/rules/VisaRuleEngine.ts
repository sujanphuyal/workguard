import { addDays, startOfDay } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

import { SUBCLASS_500_DEFAULT } from '@/rules/ruleProfiles';
import type {
  ComplianceResult,
  ComplianceStatus,
  DateRange,
  RuleProfile,
  Shift,
  ShiftSuggestion,
  ShiftValidationError,
  UserContext,
} from '@/types';
import {
  areShiftsDuplicate,
  filterShiftsForForecast,
  filterShiftsForHistory,
  getShiftOverlap,
  sumShiftMinutes,
} from '@/utils/shifts';
import {
  addMinutes,
  calculateDurationMinutes,
  getRollingWindowBounds,
  hoursToMinutes,
  isWithinAnyBreak,
  minutesToHours,
  rangesOverlap,
} from '@/utils/time';

function isResearchCourse(courseType: UserContext['courseType']): boolean {
  return courseType === 'masters_research' || courseType === 'phd';
}

function isUnlimitedAtDate(
  date: Date,
  context: UserContext,
  profile: RuleProfile,
): boolean {
  if (profile.unlimitedDuringSemesterBreaks && isWithinAnyBreak(date, context.semesterBreaks)) {
    return true;
  }

  if (
    profile.researchDegreeUnlimitedAfterCommencement &&
    isResearchCourse(context.courseType) &&
    context.courseCommencementDate &&
    date >= context.courseCommencementDate
  ) {
    return true;
  }

  return false;
}

function shiftOverlapsWindow(shift: Shift, window: DateRange): boolean {
  const shiftRange: DateRange = { start: shift.startTime, end: shift.endTime };
  return rangesOverlap(shiftRange, window);
}

function getEffectiveShiftsInWindow(
  shifts: Shift[],
  window: DateRange,
  asOfDate: Date,
  includeScheduled: boolean,
  timezone: string,
): Shift[] {
  const localTodayStart = fromZonedTime(startOfDay(toZonedTime(asOfDate, timezone)), timezone);
  return shifts.filter((shift) => {
    if (!shiftOverlapsWindow(shift, window)) return false;
    if (shift.status === 'worked') return true;
    if (includeScheduled && shift.status === 'scheduled') {
      return shift.startTime >= localTodayStart;
    }
    return false;
  });
}

function getPlanningShiftsInWindow(
  shifts: Shift[],
  window: DateRange,
): Shift[] {
  const forecastShifts = filterShiftsForForecast(shifts);
  return forecastShifts.filter((shift) => shiftOverlapsWindow(shift, window));
}

/** Projected hours for a rolling window ending on windowEndDate (all worked + scheduled in window). */
export function calculatePlanningProjectedHours(
  shifts: Shift[],
  windowEndDate: Date,
  context: UserContext,
  profile: RuleProfile = SUBCLASS_500_DEFAULT,
): number {
  if (!profile.enabled) return 0;
  if (isUnlimitedAtDate(windowEndDate, context, profile)) return 0;

  const window = rollingWindow(windowEndDate, profile, context.timezone);
  const inWindow = getPlanningShiftsInWindow(shifts, window);
  return minutesToHours(sumShiftMinutes(inWindow));
}

export interface PeakWindowResult {
  peakProjectedHours: number;
  peakWindowStart: Date;
  peakWindowEnd: Date;
}

/** Scan every rolling window from today through the roster horizon and return the worst case. */
export function findPeakRollingWindowProjection(
  shifts: Shift[],
  context: UserContext,
  profile: RuleProfile = SUBCLASS_500_DEFAULT,
  fromDate: Date = new Date(),
): PeakWindowResult {
  const forecastShifts = filterShiftsForForecast(shifts);
  const tz = context.timezone;
  const today = fromZonedTime(startOfDay(toZonedTime(fromDate, tz)), tz);

  if (forecastShifts.length === 0) {
    const window = rollingWindow(fromDate, profile, tz);
    const hours = calculatePlanningProjectedHours(shifts, fromDate, context, profile);
    return {
      peakProjectedHours: hours,
      peakWindowStart: window.start,
      peakWindowEnd: window.end,
    };
  }

  let latestShiftEnd = today;
  for (const shift of forecastShifts) {
    if (shift.endTime > latestShiftEnd) latestShiftEnd = shift.endTime;
  }

  const scanUntil = addDays(
    fromZonedTime(startOfDay(toZonedTime(latestShiftEnd, tz)), tz),
    profile.rollingWindowDays,
  );

  let peakHours = 0;
  let peakEnd = today;

  for (let day = today; day <= scanUntil; day = addDays(day, 1)) {
    const hours = calculatePlanningProjectedHours(shifts, day, context, profile);
    if (hours > peakHours) {
      peakHours = hours;
      peakEnd = day;
    }
  }

  const peakWindow = rollingWindow(peakEnd, profile, tz);
  return {
    peakProjectedHours: peakHours,
    peakWindowStart: peakWindow.start,
    peakWindowEnd: peakWindow.end,
  };
}

export function isShiftInFutureViolation(
  shift: Shift,
  allShifts: Shift[],
  context: UserContext,
  profile: RuleProfile = SUBCLASS_500_DEFAULT,
  fromDate: Date = new Date(),
): boolean {
  if (shift.status !== 'scheduled' || shift.deletedAt) return false;

  const tz = context.timezone;
  const today = fromZonedTime(startOfDay(toZonedTime(fromDate, tz)), tz);
  const scanStart = addDays(shift.startTime, -(profile.rollingWindowDays - 1));
  const scanEnd = addDays(shift.endTime, profile.rollingWindowDays - 1);
  const start = scanStart < today ? today : fromZonedTime(startOfDay(toZonedTime(scanStart, tz)), tz);

  for (let day = start; day <= scanEnd; day = addDays(day, 1)) {
    if (isUnlimitedAtDate(day, context, profile)) continue;
    const window = rollingWindow(day, profile, tz);
    if (!shiftOverlapsWindow(shift, window)) continue;
    const hours = calculatePlanningProjectedHours(allShifts, day, context, profile);
    if (hours > profile.maxHours) return true;
  }

  return false;
}

export function rollingWindow(
  asOfDate: Date,
  profile: RuleProfile,
  timezone: string,
): DateRange {
  return getRollingWindowBounds(asOfDate, profile.rollingWindowDays, timezone);
}

export function calculateHours(
  shifts: Shift[],
  asOfDate: Date,
  context: UserContext,
  profile: RuleProfile = SUBCLASS_500_DEFAULT,
): number {
  if (!profile.enabled) return 0;
  if (isUnlimitedAtDate(asOfDate, context, profile)) return 0;

  const window = rollingWindow(asOfDate, profile, context.timezone);
  const historical = filterShiftsForHistory(shifts);
  const inWindow = getEffectiveShiftsInWindow(historical, window, asOfDate, false, context.timezone);
  return minutesToHours(sumShiftMinutes(inWindow));
}

export function calculateProjectedHours(
  shifts: Shift[],
  asOfDate: Date,
  context: UserContext,
  profile: RuleProfile = SUBCLASS_500_DEFAULT,
): number {
  if (!profile.enabled) return 0;
  if (isUnlimitedAtDate(asOfDate, context, profile)) return 0;

  const window = rollingWindow(asOfDate, profile, context.timezone);
  const forecastShifts = filterShiftsForForecast(shifts);
  const inWindow = getEffectiveShiftsInWindow(
    forecastShifts,
    window,
    asOfDate,
    true,
    context.timezone,
  );
  return minutesToHours(sumShiftMinutes(inWindow));
}

export function calculateRemainingHours(
  shifts: Shift[],
  asOfDate: Date,
  context: UserContext,
  profile: RuleProfile = SUBCLASS_500_DEFAULT,
): number {
  if (isUnlimitedAtDate(asOfDate, context, profile)) {
    return Number.POSITIVE_INFINITY;
  }
  const projected = calculateProjectedHours(shifts, asOfDate, context, profile);
  return Math.max(0, profile.maxHours - projected);
}

function resolveComplianceStatus(
  projectedHours: number,
  maxHours: number,
  warningPercentage: number,
): ComplianceStatus {
  if (projectedHours > maxHours) return 'violation';
  const warningThreshold = maxHours * (warningPercentage / 100);
  if (projectedHours > warningThreshold) return 'warning';
  return 'compliant';
}

export function detectViolation(
  hours: number,
  profile: RuleProfile,
  context: UserContext,
  date: Date,
): boolean {
  if (isUnlimitedAtDate(date, context, profile)) return false;
  return hours > profile.maxHours;
}

export function forecastCompliance(
  shifts: Shift[],
  asOfDate: Date,
  context: UserContext,
  profile: RuleProfile = SUBCLASS_500_DEFAULT,
  warningPercentage = 80,
): ComplianceResult {
  const window = rollingWindow(asOfDate, profile, context.timezone);
  const unlimited = isUnlimitedAtDate(asOfDate, context, profile);
  const currentHours = calculateHours(shifts, asOfDate, context, profile);
  const projectedHours = unlimited ? 0 : calculateProjectedHours(shifts, asOfDate, context, profile);
  const peak = unlimited
    ? {
        peakProjectedHours: 0,
        peakWindowStart: window.start,
        peakWindowEnd: window.end,
      }
    : findPeakRollingWindowProjection(shifts, context, profile, asOfDate);

  const effectiveProjected = unlimited
    ? 0
    : Math.max(projectedHours, peak.peakProjectedHours);
  const maxHours = profile.maxHours;
  const remainingHours = unlimited
    ? Number.POSITIVE_INFINITY
    : Math.max(0, maxHours - effectiveProjected);

  const hasFutureWindowViolation =
    !unlimited && peak.peakProjectedHours > maxHours && projectedHours <= maxHours;

  const status: ComplianceStatus = unlimited
    ? 'compliant'
    : resolveComplianceStatus(effectiveProjected, maxHours, warningPercentage);

  return {
    status,
    currentHours,
    projectedHours,
    peakProjectedHours: peak.peakProjectedHours,
    peakWindowStart: peak.peakWindowStart,
    peakWindowEnd: peak.peakWindowEnd,
    maxHours,
    remainingHours,
    windowStart: window.start,
    windowEnd: window.end,
    isUnlimited: unlimited,
    hasFutureWindowViolation,
  };
}

export function validateShift(
  shift: Shift,
  existingShifts: Shift[],
  _context: UserContext,
): ShiftValidationError[] {
  const errors: ShiftValidationError[] = [];
  const gross = calculateDurationMinutes(shift.startTime, shift.endTime);
  const breakMinutes = shift.breakMinutes ?? 0;

  if (Number.isNaN(shift.startTime.getTime()) || Number.isNaN(shift.endTime.getTime())) {
    errors.push({ code: 'invalid_date', message: 'Invalid date or time.' });
    return errors;
  }

  if (gross < 0) {
    errors.push({ code: 'end_before_start', message: 'End time must be after start time.' });
  } else if (breakMinutes > gross) {
    errors.push({
      code: 'break_exceeds_shift',
      message: 'Break time cannot be longer than the shift.',
    });
  } else if (shift.durationMinutes <= 0) {
    errors.push({ code: 'negative_duration', message: 'Worked hours must be greater than zero.' });
  }

  for (const existing of existingShifts) {
    if (existing.deletedAt || existing.id === shift.id) continue;
    if (areShiftsDuplicate(shift, existing)) {
      errors.push({ code: 'duplicate', message: 'A duplicate shift already exists.' });
    }
    if (getShiftOverlap(shift, existing)) {
      errors.push({ code: 'overlap', message: 'This shift overlaps with an existing shift.' });
      break;
    }
  }

  return errors;
}

export function simulateRoster(
  shifts: Shift[],
  context: UserContext,
  profile: RuleProfile = SUBCLASS_500_DEFAULT,
  asOfDate: Date = new Date(),
  warningPercentage = 80,
): ComplianceResult {
  return forecastCompliance(shifts, asOfDate, context, profile, warningPercentage);
}

export function simulateFutureShift(
  shifts: Shift[],
  candidateShift: Shift,
  context: UserContext,
  profile: RuleProfile = SUBCLASS_500_DEFAULT,
  asOfDate: Date = new Date(),
  warningPercentage = 80,
): ComplianceResult {
  const withoutCandidate = shifts.filter((s) => s.id !== candidateShift.id);
  return forecastCompliance(
    [...withoutCandidate, candidateShift],
    asOfDate,
    context,
    profile,
    warningPercentage,
  );
}

export function detectFutureViolations(
  shifts: Shift[],
  context: UserContext,
  profile: RuleProfile = SUBCLASS_500_DEFAULT,
  asOfDate: Date = new Date(),
): Shift[] {
  const scheduled = shifts.filter((s) => !s.deletedAt && s.status === 'scheduled');
  return scheduled.filter((shift) =>
    isShiftInFutureViolation(shift, shifts, context, profile, asOfDate),
  );
}

export function nextAvailableHour(
  shifts: Shift[],
  context: UserContext,
  profile: RuleProfile = SUBCLASS_500_DEFAULT,
  asOfDate: Date = new Date(),
): number {
  if (isUnlimitedAtDate(asOfDate, context, profile)) {
    return Number.POSITIVE_INFINITY;
  }
  return calculateRemainingHours(shifts, asOfDate, context, profile);
}

export function findEarliestAvailableStart(
  shifts: Shift[],
  shiftDurationMinutes: number,
  context: UserContext,
  profile: RuleProfile = SUBCLASS_500_DEFAULT,
  searchFrom: Date = new Date(),
  maxSearchDays = 365,
): Date | null {
  if (isUnlimitedAtDate(searchFrom, context, profile)) {
    return searchFrom;
  }

  let candidate = searchFrom;
  for (let day = 0; day < maxSearchDays; day += 1) {
    if (isUnlimitedAtDate(candidate, context, profile)) {
      return candidate;
    }

    const testShift: Shift = {
      id: '__test__',
      userId: '',
      employerId: '',
      status: 'scheduled',
      startTime: candidate,
      endTime: addMinutes(candidate, shiftDurationMinutes),
      durationMinutes: shiftDurationMinutes,
      breakMinutes: 0,
      createdAt: candidate,
      updatedAt: candidate,
    };

    const result = simulateFutureShift(shifts, testShift, context, profile, searchFrom);
    if (result.status !== 'violation') {
      return candidate;
    }

    candidate = addDays(candidate, 1);
  }

  return null;
}

export function suggestShiftAdjustment(
  shifts: Shift[],
  violatingShift: Shift,
  context: UserContext,
  profile: RuleProfile = SUBCLASS_500_DEFAULT,
  asOfDate: Date = new Date(),
): ShiftSuggestion[] {
  const suggestions: ShiftSuggestion[] = [];
  const peak = findPeakRollingWindowProjection(shifts, context, profile, asOfDate);
  const remainingMinutes = hoursToMinutes(
    Math.max(0, profile.maxHours - peak.peakProjectedHours),
  );

  if (remainingMinutes > 0 && remainingMinutes < violatingShift.durationMinutes) {
    suggestions.push({
      type: 'reduce_duration',
      description: `Reduce shift to ${minutesToHours(remainingMinutes)} hours to stay within limit.`,
      adjustedShift: {
        ...violatingShift,
        endTime: addMinutes(violatingShift.startTime, remainingMinutes),
        durationMinutes: remainingMinutes,
      },
    });
  }

  const movedStart = findEarliestAvailableStart(
    shifts.filter((s) => s.id !== violatingShift.id),
    violatingShift.durationMinutes,
    context,
    profile,
    addDays(violatingShift.startTime, 1),
  );

  if (movedStart) {
    suggestions.push({
      type: 'move_shift',
      description: 'Move shift to when hours become available.',
      adjustedShift: {
        ...violatingShift,
        startTime: movedStart,
        endTime: addMinutes(movedStart, violatingShift.durationMinutes),
      },
      suggestedDate: movedStart,
    });
  }

  const breakSuggestion = suggestSafeDate(shifts, violatingShift.durationMinutes, context, profile);
  if (breakSuggestion) {
    suggestions.push({
      type: 'work_during_break',
      description: 'Schedule during an upcoming semester break when limits do not apply.',
      suggestedDate: breakSuggestion,
    });
  }

  suggestions.push({
    type: 'delete_shift',
    description: 'Remove this shift from your roster.',
  });

  return suggestions;
}

export function suggestSafeDate(
  _shifts: Shift[],
  _durationMinutes: number,
  context: UserContext,
  _profile: RuleProfile = SUBCLASS_500_DEFAULT,
  fromDate: Date = new Date(),
): Date | null {
  const upcoming = context.semesterBreaks
    .filter((b) => b.end >= fromDate)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return upcoming[0]?.start ?? null;
}

/** Visa rule engine — pure domain logic, no UI or infrastructure dependencies. */
export class VisaRuleEngine {
  constructor(
    private readonly profile: RuleProfile = SUBCLASS_500_DEFAULT,
    private readonly warningPercentage = 80,
  ) {}

  rollingWindow(asOfDate: Date, timezone: string): DateRange {
    return rollingWindow(asOfDate, this.profile, timezone);
  }

  calculateHours(shifts: Shift[], asOfDate: Date, context: UserContext): number {
    return calculateHours(shifts, asOfDate, context, this.profile);
  }

  calculateRemainingHours(shifts: Shift[], asOfDate: Date, context: UserContext): number {
    return calculateRemainingHours(shifts, asOfDate, context, this.profile);
  }

  validateShift(shift: Shift, existingShifts: Shift[], context: UserContext): ShiftValidationError[] {
    return validateShift(shift, existingShifts, context);
  }

  detectViolation(hours: number, context: UserContext, date: Date): boolean {
    return detectViolation(hours, this.profile, context, date);
  }

  forecastCompliance(shifts: Shift[], asOfDate: Date, context: UserContext): ComplianceResult {
    return forecastCompliance(shifts, asOfDate, context, this.profile, this.warningPercentage);
  }

  simulateRoster(shifts: Shift[], context: UserContext, asOfDate?: Date): ComplianceResult {
    return simulateRoster(shifts, context, this.profile, asOfDate ?? new Date(), this.warningPercentage);
  }

  simulateFutureShift(
    shifts: Shift[],
    candidateShift: Shift,
    context: UserContext,
    asOfDate?: Date,
  ): ComplianceResult {
    return simulateFutureShift(
      shifts,
      candidateShift,
      context,
      this.profile,
      asOfDate ?? new Date(),
      this.warningPercentage,
    );
  }

  nextAvailableHour(shifts: Shift[], context: UserContext, asOfDate?: Date): number {
    return nextAvailableHour(shifts, context, this.profile, asOfDate ?? new Date());
  }

  findEarliestAvailableStart(
    shifts: Shift[],
    shiftDurationMinutes: number,
    context: UserContext,
    searchFrom?: Date,
  ): Date | null {
    return findEarliestAvailableStart(
      shifts,
      shiftDurationMinutes,
      context,
      this.profile,
      searchFrom ?? new Date(),
    );
  }

  calculateProjectedHours(shifts: Shift[], asOfDate: Date, context: UserContext): number {
    return calculateProjectedHours(shifts, asOfDate, context, this.profile);
  }

  detectFutureViolations(shifts: Shift[], context: UserContext, asOfDate?: Date): Shift[] {
    return detectFutureViolations(shifts, context, this.profile, asOfDate ?? new Date());
  }

  findPeakRollingWindowProjection(shifts: Shift[], context: UserContext, fromDate?: Date): PeakWindowResult {
    return findPeakRollingWindowProjection(shifts, context, this.profile, fromDate ?? new Date());
  }

  isShiftInFutureViolation(
    shift: Shift,
    allShifts: Shift[],
    context: UserContext,
    fromDate?: Date,
  ): boolean {
    return isShiftInFutureViolation(shift, allShifts, context, this.profile, fromDate ?? new Date());
  }

  suggestShiftAdjustment(
    shifts: Shift[],
    violatingShift: Shift,
    context: UserContext,
    asOfDate?: Date,
  ): ShiftSuggestion[] {
    return suggestShiftAdjustment(
      shifts,
      violatingShift,
      context,
      this.profile,
      asOfDate ?? new Date(),
    );
  }

  suggestSafeDate(
    shifts: Shift[],
    durationMinutes: number,
    context: UserContext,
    fromDate?: Date,
  ): Date | null {
    return suggestSafeDate(shifts, durationMinutes, context, this.profile, fromDate ?? new Date());
  }
}
