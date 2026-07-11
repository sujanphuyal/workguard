import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from 'date-fns';

import type { Shift } from '@/types';
import { sortShiftsByStart } from '@/utils/shifts';

const WEEK_OPTS = { weekStartsOn: 1 as const };

export type ShiftRangePreset = 'all' | 'week' | 'month' | 'custom';

export interface ShiftDateRange {
  start: Date;
  end: Date;
}

export function getWeekRange(anchor: Date): ShiftDateRange {
  return {
    start: startOfWeek(anchor, WEEK_OPTS),
    end: endOfWeek(anchor, WEEK_OPTS),
  };
}

export function getMonthRange(anchor: Date): ShiftDateRange {
  return {
    start: startOfMonth(anchor),
    end: endOfMonth(anchor),
  };
}

export function getCustomRange(start: Date, end: Date): ShiftDateRange {
  const rangeStart = startOfDay(start);
  const rangeEnd = endOfDay(end);
  return {
    start: rangeStart <= rangeEnd ? rangeStart : rangeEnd,
    end: rangeStart <= rangeEnd ? rangeEnd : rangeStart,
  };
}

export function filterShiftsInRange(shifts: Shift[], range: ShiftDateRange): Shift[] {
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();
  return sortShiftsByStart(
    shifts.filter((shift) => {
      const time = shift.startTime.getTime();
      return time >= startMs && time <= endMs;
    }),
  );
}

export function resolveShiftRange(
  preset: ShiftRangePreset,
  anchor: Date,
  customStart: Date,
  customEnd: Date,
): ShiftDateRange | null {
  if (preset === 'all') return null;
  if (preset === 'week') return getWeekRange(anchor);
  if (preset === 'month') return getMonthRange(anchor);
  return getCustomRange(customStart, customEnd);
}
