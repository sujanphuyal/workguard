import type { Shift, ShiftStatus } from '@/types';

export function isHistoricalStatus(status: ShiftStatus): boolean {
  return status === 'worked';
}

export function isForecastStatus(status: ShiftStatus): boolean {
  return status === 'worked' || status === 'scheduled';
}

export function isIgnoredStatus(status: ShiftStatus): boolean {
  return status === 'cancelled' || status === 'missed';
}

export function filterShiftsForHistory(shifts: Shift[]): Shift[] {
  return shifts.filter((s) => !s.deletedAt && isHistoricalStatus(s.status));
}

export function filterShiftsForForecast(shifts: Shift[]): Shift[] {
  return shifts.filter((s) => !s.deletedAt && isForecastStatus(s.status));
}

export function filterActiveShifts(shifts: Shift[]): Shift[] {
  return shifts.filter((s) => !s.deletedAt);
}

export function getShiftOverlap(a: Shift, b: Shift): boolean {
  if (a.id === b.id) return false;
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

export function areShiftsDuplicate(a: Shift, b: Shift): boolean {
  if (a.id === b.id) return false;
  return (
    a.employerId === b.employerId &&
    a.startTime.getTime() === b.startTime.getTime() &&
    a.endTime.getTime() === b.endTime.getTime()
  );
}

export function sortShiftsByStart(shifts: Shift[]): Shift[] {
  return [...shifts].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/** Upcoming scheduled shifts first (nearest start), then all other shifts (most recent first). */
export function sortShiftsNearestUpcomingFirst(shifts: Shift[]): Shift[] {
  const now = Date.now();
  const upcoming = shifts
    .filter((s) => s.status === 'scheduled' && s.startTime.getTime() > now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const others = shifts
    .filter((s) => !(s.status === 'scheduled' && s.startTime.getTime() > now))
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  return [...upcoming, ...others];
}

export function sumShiftMinutes(shifts: Shift[]): number {
  return shifts.reduce((sum, s) => sum + s.durationMinutes, 0);
}

/** Merge a calendar date with hours/minutes from a time-only Date. */
export function combineDateAndTime(datePart: Date, timePart: Date): Date {
  const combined = new Date(datePart);
  combined.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  return combined;
}

/** Past or current start → worked; future start → scheduled. */
export function inferShiftStatus(startTime: Date): 'worked' | 'scheduled' {
  return startTime.getTime() <= Date.now() ? 'worked' : 'scheduled';
}

export function defaultShiftTimes(): { start: Date; end: Date } {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(9);
  const end = new Date(start);
  end.setHours(13);
  return { start, end };
}
