import { addDays, endOfDay, startOfDay } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

import { MINUTES_PER_HOUR } from '@/constants';
import type { DateRange } from '@/types';

export function minutesToHours(minutes: number): number {
  return Math.round((minutes / MINUTES_PER_HOUR) * 100) / 100;
}

export function hoursToMinutes(hours: number): number {
  return Math.round(hours * MINUTES_PER_HOUR);
}

export function calculateDurationMinutes(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime();
  if (diff < 0) return -1;
  return Math.round(diff / 60000);
}

/** Gross shift length minus unpaid break (used for compliance / worked hours). */
export function calculateNetDurationMinutes(
  start: Date,
  end: Date,
  breakMinutes = 0,
): number {
  const gross = calculateDurationMinutes(start, end);
  if (gross < 0) return -1;
  const safeBreak = Math.max(0, Math.round(breakMinutes));
  if (safeBreak > gross) return -1;
  return gross - safeBreak;
}

export function getLocalDayBounds(date: Date, timezone: string): { start: Date; end: Date } {
  const zoned = toZonedTime(date, timezone);
  const dayStart = startOfDay(zoned);
  const dayEnd = endOfDay(zoned);
  return {
    start: fromZonedTime(dayStart, timezone),
    end: fromZonedTime(dayEnd, timezone),
  };
}

export function getRollingWindowBounds(
  asOfDate: Date,
  rollingWindowDays: number,
  timezone: string,
): DateRange {
  const { end: windowEnd } = getLocalDayBounds(asOfDate, timezone);
  const zonedEnd = toZonedTime(asOfDate, timezone);
  const zonedStart = startOfDay(addDays(zonedEnd, -(rollingWindowDays - 1)));
  const windowStart = fromZonedTime(zonedStart, timezone);
  return { start: windowStart, end: windowEnd };
}

export function isDateInRange(date: Date, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

export function isWithinAnyBreak(date: Date, breaks: DateRange[]): boolean {
  return breaks.some((b) => isDateInRange(date, b));
}

export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.start < b.end && b.start < a.end;
}

export function formatHours(hours: number): string {
  return hours.toFixed(hours % 1 === 0 ? 0 : 1);
}

export function parseISODate(value: string): Date {
  return new Date(value);
}

export function toISOString(date: Date): string {
  return date.toISOString();
}

export function isSameInstant(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}
