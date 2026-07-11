export type ShiftStatus = 'scheduled' | 'worked' | 'cancelled' | 'missed';

export type CourseType =
  | 'bachelors'
  | 'masters_coursework'
  | 'masters_research'
  | 'phd';

export type ComplianceStatus = 'compliant' | 'warning' | 'violation';

export type ThemePreference = 'system' | 'light' | 'dark';

export type RecurrenceFrequency = 'weekly' | 'fortnightly' | 'monthly' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface RuleProfile {
  id: string;
  name: string;
  enabled: boolean;
  maxHours: number;
  rollingWindowDays: number;
  appliesDuringTeachingPeriods: boolean;
  unlimitedDuringSemesterBreaks: boolean;
  researchDegreeUnlimitedAfterCommencement: boolean;
}

export interface UserContext {
  courseType: CourseType;
  courseCommencementDate?: Date;
  semesterBreaks: DateRange[];
  timezone: string;
}

export interface Shift {
  id: string;
  userId: string;
  employerId: string;
  status: ShiftStatus;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  /** Unpaid break time deducted from gross shift length */
  breakMinutes: number;
  notes?: string;
  recurrenceGroupId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Employer {
  id: string;
  userId: string;
  name: string;
  location?: string;
  position?: string;
  colour: string;
  hourlyRate?: number;
  createdAt: Date;
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  university?: string;
  courseName?: string;
  courseType: CourseType;
  courseCommencementDate?: Date;
  visaExpiry?: Date;
  timezone: string;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  userId: string;
  notificationsEnabled: boolean;
  theme: ThemePreference;
  language: string;
  warningPercentage: number;
  /** Fortnightly work-hour limit (rolling 14-day window) */
  maxHours: number;
  shiftSchedules: ShiftSchedulePreset[];
}

export interface ShiftSchedulePreset {
  id: string;
  employerId: string;
  label: string;
  /** Clock time in 24h HH:mm format */
  startTime: string;
  /** Clock time in 24h HH:mm format */
  endTime: string;
}

export interface SemesterBreak {
  id: string;
  userId: string;
  title: string;
  startDate: Date;
  endDate: Date;
}

export interface ComplianceResult {
  status: ComplianceStatus;
  currentHours: number;
  /** Hours in the rolling window ending today */
  projectedHours: number;
  /** Highest projected hours in any rolling window (includes future scheduled) */
  peakProjectedHours: number;
  peakWindowStart: Date;
  peakWindowEnd: Date;
  maxHours: number;
  remainingHours: number;
  windowStart: Date;
  windowEnd: Date;
  isUnlimited: boolean;
  /** True when a future rolling window exceeds the limit even if today's window does not */
  hasFutureWindowViolation: boolean;
}

export interface ShiftValidationError {
  code:
    | 'negative_duration'
    | 'end_before_start'
    | 'break_exceeds_shift'
    | 'duplicate'
    | 'overlap'
    | 'invalid_date';
  message: string;
}

export interface ShiftSuggestion {
  type: 'reduce_duration' | 'move_shift' | 'delete_shift' | 'work_during_break';
  description: string;
  adjustedShift?: Partial<Shift>;
  suggestedDate?: Date;
}

export interface ShiftFilter {
  employerId?: string;
  status?: ShiftStatus;
  startDate?: Date;
  endDate?: Date;
  minHours?: number;
  maxHours?: number;
  keyword?: string;
}

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate: Date;
  occurrences?: number;
}

export type SyncOperation = 'insert' | 'update' | 'delete';

export interface PendingMutation {
  id: string;
  table: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  clientId: string;
  createdAt: string;
  retryCount: number;
}
