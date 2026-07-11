export const AUSTRALIAN_TIMEZONES = [
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'Australia/Adelaide',
  'Australia/Hobart',
  'Australia/Darwin',
  'Australia/Canberra',
] as const;

export const COURSE_TYPE_OPTIONS = [
  { value: 'bachelors', label: 'Bachelors' },
  { value: 'masters_coursework', label: 'Masters (coursework)' },
  { value: 'masters_research', label: 'Masters (research)' },
  { value: 'phd', label: 'PhD' },
] as const;

export const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;
