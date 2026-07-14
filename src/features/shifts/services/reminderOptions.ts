export interface ReminderOption {
  label: string;
  /** null = none; 0 = at time of event; otherwise minutes before */
  minutes: number | null;
}

export const REMINDER_OPTIONS: ReminderOption[] = [
  { label: 'None', minutes: null },
  { label: 'At time of event', minutes: 0 },
  { label: '5 minutes before', minutes: 5 },
  { label: '10 minutes before', minutes: 10 },
  { label: '15 minutes before', minutes: 15 },
  { label: '30 minutes before', minutes: 30 },
  { label: '1 hour before', minutes: 60 },
  { label: '2 hours before', minutes: 120 },
  { label: '1 day before', minutes: 24 * 60 },
  { label: '2 days before', minutes: 2 * 24 * 60 },
  { label: '1 week before', minutes: 7 * 24 * 60 },
];

export function getReminderLabel(minutes: number | null | undefined): string {
  const match = REMINDER_OPTIONS.find((option) => option.minutes === (minutes ?? null));
  return match?.label ?? 'None';
}

/**
 * Reminder options that can still fire before the shift starts.
 * Trigger time must be in the future (at-event allowed if start is still ahead).
 */
export function getValidReminderOptions(
  shiftStart: Date,
  now: Date = new Date(),
): ReminderOption[] {
  const msUntilStart = shiftStart.getTime() - now.getTime();

  return REMINDER_OPTIONS.filter((option) => {
    if (option.minutes === null) return true;
    if (msUntilStart <= 0) return false;
    const offsetMs = option.minutes * 60 * 1000;
    // Need at least 1s of lead time so the scheduler can fire
    return msUntilStart - offsetMs >= 1_000;
  });
}

export function isReminderOptionValid(
  minutes: number | null | undefined,
  shiftStart: Date,
  now: Date = new Date(),
): boolean {
  return getValidReminderOptions(shiftStart, now).some(
    (option) => option.minutes === (minutes ?? null),
  );
}

export function resolveValidReminder(
  minutes: number | null | undefined,
  shiftStart: Date,
  now: Date = new Date(),
): number | null {
  if (isReminderOptionValid(minutes, shiftStart, now)) {
    return minutes ?? null;
  }
  return null;
}
