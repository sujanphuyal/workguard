import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useMemo } from 'react';

import type { Shift } from '@/types';

const WEEK_OPTS = { weekStartsOn: 1 as const };

function filterScheduledShifts(shifts: Shift[]): Shift[] {
  return shifts
    .filter((s) => s.status === 'scheduled')
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

export function useScheduledShifts(shifts: Shift[]) {
  return useMemo(() => filterScheduledShifts(shifts), [shifts]);
}

export function useShiftsByDay(scheduled: Shift[]) {
  return useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const shift of scheduled) {
      const key = format(shift.startTime, 'yyyy-MM-dd');
      const list = map.get(key) ?? [];
      list.push(shift);
      map.set(key, list);
    }
    return map;
  }, [scheduled]);
}

export function getMonthGridDays(anchor: Date): Date[] {
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, WEEK_OPTS);
  const gridEnd = endOfWeek(monthEnd, WEEK_OPTS);
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor, WEEK_OPTS);
  const end = endOfWeek(anchor, WEEK_OPTS);
  return eachDayOfInterval({ start, end });
}

export function groupShiftsByDate(shifts: Shift[]): { date: Date; shifts: Shift[] }[] {
  const groups: { date: Date; shifts: Shift[] }[] = [];
  let currentKey = '';

  for (const shift of shifts) {
    const key = format(shift.startTime, 'yyyy-MM-dd');
    if (key !== currentKey) {
      groups.push({ date: shift.startTime, shifts: [shift] });
      currentKey = key;
    } else {
      groups[groups.length - 1]!.shifts.push(shift);
    }
  }

  return groups;
}

export { isSameDay, isSameMonth, isToday, format, addMonths, startOfMonth };
