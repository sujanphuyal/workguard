import type { Shift, UserContext } from '@/types';

const TZ = 'Australia/Melbourne';

export function createContext(overrides: Partial<UserContext> = {}): UserContext {
  return {
    courseType: 'bachelors',
    semesterBreaks: [],
    timezone: TZ,
    ...overrides,
  };
}

export function createShift(
  start: string,
  hours: number,
  overrides: Partial<Shift> = {},
): Shift {
  const startTime = new Date(start);
  const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
  return {
    id: overrides.id ?? `shift-${start}-${hours}`,
    userId: 'user-1',
    employerId: 'emp-1',
    status: 'worked',
    startTime,
    endTime,
    durationMinutes: hours * 60,
    breakMinutes: 0,
    createdAt: startTime,
    updatedAt: startTime,
    ...overrides,
  };
}

export function createDailyShifts(
  startDate: string,
  days: number,
  hoursPerDay: number,
): Shift[] {
  const shifts: Shift[] = [];
  const base = new Date(startDate);
  for (let i = 0; i < days; i += 1) {
    const day = new Date(base);
    day.setDate(base.getDate() + i);
    day.setHours(9, 0, 0, 0);
    shifts.push(
      createShift(day.toISOString(), hoursPerDay, {
        id: `daily-${i}`,
      }),
    );
  }
  return shifts;
}

export { TZ };
