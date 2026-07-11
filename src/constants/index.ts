export const LEGAL_DISCLAIMER =
  'This application is a personal work-hours tracking and planning tool. It is designed to help students monitor their work hours based on information they enter. It does not provide legal or migration advice, does not verify employment records, and does not guarantee compliance with Australian visa conditions. Users are responsible for complying with all applicable visa conditions and should refer to official Australian Government guidance or seek professional advice where appropriate.';

export const DEFAULT_TIMEZONE = 'Australia/Sydney';

export const DEFAULT_WARNING_PERCENTAGE = 80;

export const DEFAULT_MAX_HOURS = 48;

export const DEFAULT_BREAK_MINUTES = 30;

export const DEFAULT_ROLLING_WINDOW_DAYS = 14;

export const EMPLOYER_COLOURS = [
  '#6750A4',
  '#006A6A',
  '#984061',
  '#006E1C',
  '#8B5000',
  '#00639B',
  '#984720',
  '#4A4458',
];

export const MINUTES_PER_HOUR = 60;

export const SYNC_BATCH_SIZE = 500;

/** Fixed local-only user id for guest mode (never synced to Supabase). */
export const GUEST_USER_ID = '00000000-0000-4000-8000-000000000001';

export const GUEST_MODE_STORAGE_KEY = 'guest_mode';
export const GUEST_PROFILE_STORAGE_KEY = 'guest_profile';

/** Device theme for signed-out screens (login) and fallback before account settings load. */
export const PREVIEW_THEME_STORAGE_KEY = 'preview_theme';

export const QUERY_KEYS = {
  profile: ['profile'] as const,
  settings: ['settings'] as const,
  employers: ['employers'] as const,
  shifts: ['shifts'] as const,
  semesterBreaks: ['semesterBreaks'] as const,
  compliance: ['compliance'] as const,
  analytics: ['analytics'] as const,
};
