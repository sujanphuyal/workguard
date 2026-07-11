import type { SQLiteDatabase } from 'expo-sqlite';

export const SCHEMA_VERSION = 4;

export const CREATE_TABLES_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS sync_metadata (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_mutations (
  id TEXT PRIMARY KEY NOT NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT NOT NULL,
  client_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  university TEXT,
  course_name TEXT,
  course_type TEXT NOT NULL,
  course_commencement_date TEXT,
  visa_expiry TEXT,
  timezone TEXT NOT NULL,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  user_id TEXT PRIMARY KEY NOT NULL,
  notifications_enabled INTEGER NOT NULL DEFAULT 1,
  theme TEXT NOT NULL DEFAULT 'light',
  language TEXT NOT NULL DEFAULT 'en',
  warning_percentage INTEGER NOT NULL DEFAULT 80,
  max_hours INTEGER NOT NULL DEFAULT 48,
  shift_schedules TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS employers (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  position TEXT,
  colour TEXT NOT NULL,
  hourly_rate REAL,
  created_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'synced'
);

CREATE TABLE IF NOT EXISTS work_shifts (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  employer_id TEXT NOT NULL,
  status TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  recurrence_group_id TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'synced'
);

CREATE TABLE IF NOT EXISTS semester_breaks (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'synced'
);

CREATE INDEX IF NOT EXISTS idx_work_shifts_user_start ON work_shifts(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_work_shifts_status ON work_shifts(user_id, status, start_time);
CREATE INDEX IF NOT EXISTS idx_employers_user ON employers(user_id);
CREATE INDEX IF NOT EXISTS idx_semester_breaks_user ON semester_breaks(user_id, start_date);
`;

function columnExists(db: SQLiteDatabase, table: string, column: string): boolean {
  const cols = db.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`);
  return cols.some((c) => c.name === column);
}

export function runMigrations(db: SQLiteDatabase): void {
  const row = db.getFirstSync<{ value: string }>(
    "SELECT value FROM sync_metadata WHERE key = 'schema_version'",
  );
  let version = row ? parseInt(row.value, 10) : 0;

  if (!row) {
    db.runSync(
      "INSERT INTO sync_metadata (key, value) VALUES ('schema_version', ?)",
      String(SCHEMA_VERSION),
    );
    version = SCHEMA_VERSION;
  }

  if (version < 2 && !columnExists(db, 'work_shifts', 'break_minutes')) {
    db.execSync(
      'ALTER TABLE work_shifts ADD COLUMN break_minutes INTEGER NOT NULL DEFAULT 0',
    );
  }

  if (version < 3 && !columnExists(db, 'settings', 'max_hours')) {
    db.execSync('ALTER TABLE settings ADD COLUMN max_hours INTEGER NOT NULL DEFAULT 48');
  }

  if (version < 4 && !columnExists(db, 'settings', 'shift_schedules')) {
    db.execSync("ALTER TABLE settings ADD COLUMN shift_schedules TEXT NOT NULL DEFAULT '[]'");
  }

  if (version < SCHEMA_VERSION) {
    db.runSync(
      "UPDATE sync_metadata SET value = ? WHERE key = 'schema_version'",
      String(SCHEMA_VERSION),
    );
  }
}

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_TABLES_SQL);
  runMigrations(db);
}
