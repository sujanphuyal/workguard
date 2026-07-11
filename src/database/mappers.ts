import type {
  CourseType,
  Employer,
  Profile,
  SemesterBreak,
  Shift,
  ShiftStatus,
  ThemePreference,
  UserSettings,
} from '@/types';
import { DEFAULT_MAX_HOURS } from '@/constants';
import {
  parseShiftSchedulesJson,
  serializeShiftSchedules,
} from '@/features/settings/services/shiftSchedulePresets';
import type {
  DbEmployer,
  DbProfile,
  DbSemesterBreak,
  DbSettings,
  DbWorkShift,
} from '@/types/database';

export function mapDbProfile(row: DbProfile): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    university: row.university ?? undefined,
    courseName: row.course_name ?? undefined,
    courseType: row.course_type as CourseType,
    courseCommencementDate: row.course_commencement_date
      ? new Date(row.course_commencement_date)
      : undefined,
    visaExpiry: row.visa_expiry ? new Date(row.visa_expiry) : undefined,
    timezone: row.timezone,
    onboardingCompleted: row.onboarding_completed,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapProfileToDb(
  profile: Partial<Profile> & { id: string },
): Record<string, unknown> {
  return {
    id: profile.id,
    full_name: profile.fullName,
    email: profile.email,
    university: profile.university ?? null,
    course_name: profile.courseName ?? null,
    course_type: profile.courseType,
    course_commencement_date: profile.courseCommencementDate
      ? profile.courseCommencementDate.toISOString().slice(0, 10)
      : null,
    visa_expiry: profile.visaExpiry ? profile.visaExpiry.toISOString().slice(0, 10) : null,
    timezone: profile.timezone,
    onboarding_completed: profile.onboardingCompleted,
  };
}

export function mapDbSettings(row: DbSettings): UserSettings {
  return {
    userId: row.user_id,
    notificationsEnabled: row.notifications_enabled,
    theme: row.theme as ThemePreference,
    language: row.language,
    warningPercentage: row.warning_percentage,
    maxHours: row.max_hours ?? DEFAULT_MAX_HOURS,
    shiftSchedules: parseShiftSchedulesJson(row.shift_schedules),
  };
}

export function mapLocalSettings(row: {
  user_id: string;
  notifications_enabled: number;
  theme: string;
  language: string;
  warning_percentage: number;
  max_hours?: number;
  shift_schedules?: string;
}): UserSettings {
  return {
    userId: row.user_id,
    notificationsEnabled: Boolean(row.notifications_enabled),
    theme: row.theme as ThemePreference,
    language: row.language,
    warningPercentage: row.warning_percentage,
    maxHours: row.max_hours ?? DEFAULT_MAX_HOURS,
    shiftSchedules: parseShiftSchedulesJson(row.shift_schedules),
  };
}

export function mapDbEmployer(row: DbEmployer): Employer {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    location: row.location ?? undefined,
    position: row.position ?? undefined,
    colour: row.colour,
    hourlyRate: row.hourly_rate ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

export function mapEmployerToDb(employer: Employer): Record<string, unknown> {
  return {
    id: employer.id,
    user_id: employer.userId,
    name: employer.name,
    location: employer.location ?? null,
    position: employer.position ?? null,
    colour: employer.colour,
    hourly_rate: employer.hourlyRate ?? null,
    created_at: employer.createdAt.toISOString(),
  };
}

export function mapDbShift(row: DbWorkShift): Shift {
  return {
    id: row.id,
    userId: row.user_id,
    employerId: row.employer_id,
    status: row.status as ShiftStatus,
    startTime: new Date(row.start_time),
    endTime: new Date(row.end_time),
    durationMinutes: row.duration_minutes,
    breakMinutes: row.break_minutes ?? 0,
    notes: row.notes ?? undefined,
    recurrenceGroupId: row.recurrence_group_id ?? undefined,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapShiftToDb(shift: Shift): Record<string, unknown> {
  return {
    id: shift.id,
    user_id: shift.userId,
    employer_id: shift.employerId,
    status: shift.status,
    start_time: shift.startTime.toISOString(),
    end_time: shift.endTime.toISOString(),
    duration_minutes: shift.durationMinutes,
    break_minutes: shift.breakMinutes,
    notes: shift.notes ?? null,
    recurrence_group_id: shift.recurrenceGroupId ?? null,
    deleted_at: shift.deletedAt?.toISOString() ?? null,
    created_at: shift.createdAt.toISOString(),
    updated_at: shift.updatedAt.toISOString(),
  };
}

export function mapDbSemesterBreak(row: DbSemesterBreak): SemesterBreak {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
  };
}

export function mapSemesterBreakToDb(breakItem: SemesterBreak): Record<string, unknown> {
  return {
    id: breakItem.id,
    user_id: breakItem.userId,
    title: breakItem.title,
    start_date: breakItem.startDate.toISOString().slice(0, 10),
    end_date: breakItem.endDate.toISOString().slice(0, 10),
  };
}

export function mapSettingsToDb(settings: UserSettings): Record<string, unknown> {
  return {
    user_id: settings.userId,
    notifications_enabled: settings.notificationsEnabled,
    theme: settings.theme,
    language: settings.language,
    warning_percentage: settings.warningPercentage,
    max_hours: settings.maxHours,
    shift_schedules: serializeShiftSchedules(settings.shiftSchedules),
  };
}

export function profileToUserContext(profile: Profile, breaks: SemesterBreak[]) {
  return {
    courseType: profile.courseType,
    courseCommencementDate: profile.courseCommencementDate,
    timezone: profile.timezone,
    semesterBreaks: breaks.map((b) => ({
      start: b.startDate,
      end: b.endDate,
    })),
  };
}
