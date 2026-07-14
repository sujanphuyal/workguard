import { addDays, addMonths, addWeeks, addYears } from 'date-fns';

import type { RecurrenceConfig, RecurrenceFrequency } from '@/types';

export interface RepeatOption {
  value: RecurrenceFrequency;
  label: string;
}

export const REPEAT_OPTIONS: RepeatOption[] = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'fortnightly', label: 'Every fortnight' },
  { value: 'monthly', label: 'Every month' },
  { value: 'yearly', label: 'Every year' },
  { value: 'custom', label: 'Custom' },
];

export function getRepeatLabel(frequency: RecurrenceFrequency): string {
  return REPEAT_OPTIONS.find((option) => option.value === frequency)?.label ?? 'Does not repeat';
}

export function advanceOccurrence(
  start: Date,
  end: Date,
  config: RecurrenceConfig,
): { start: Date; end: Date } {
  const interval = Math.max(1, config.interval);

  switch (config.frequency) {
    case 'daily':
      return { start: addDays(start, interval), end: addDays(end, interval) };
    case 'weekly':
      return { start: addWeeks(start, interval), end: addWeeks(end, interval) };
    case 'fortnightly':
      return { start: addWeeks(start, 2 * interval), end: addWeeks(end, 2 * interval) };
    case 'monthly':
      return { start: addMonths(start, interval), end: addMonths(end, interval) };
    case 'yearly':
      return { start: addYears(start, interval), end: addYears(end, interval) };
    case 'custom':
      return { start: addDays(start, interval), end: addDays(end, interval) };
    default:
      return { start: addDays(start, interval), end: addDays(end, interval) };
  }
}

/** Skip the first occurrence (already created as the base shift) when expanding. */
export function listRecurrenceStarts(
  firstStart: Date,
  firstEnd: Date,
  config: RecurrenceConfig,
): Array<{ start: Date; end: Date }> {
  const results: Array<{ start: Date; end: Date }> = [];
  let current = { start: firstStart, end: firstEnd };
  const maxOccurrences = config.occurrences ?? 366;
  let count = 0;

  while (count < maxOccurrences) {
    current = advanceOccurrence(current.start, current.end, config);
    if (current.start > config.endDate) break;
    results.push(current);
    count += 1;
  }

  return results;
}
