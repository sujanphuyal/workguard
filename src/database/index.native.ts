import { CREATE_TABLES_SQL, runMigrations } from '@/database/schema';
import type { SQLiteDatabase } from 'expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

let dbInstance: SQLiteDatabase | null = null;
let initialized = false;

export function getDatabase(): SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = openDatabaseSync('workguard.db');
  }
  if (!initialized) {
    dbInstance.execSync(CREATE_TABLES_SQL);
    runMigrations(dbInstance);
    initialized = true;
  }
  return dbInstance;
}

export async function resetDatabase(): Promise<void> {
  const db = getDatabase();
  db.execSync(`
    DELETE FROM work_shifts;
    DELETE FROM employers;
    DELETE FROM semester_breaks;
    DELETE FROM profiles;
    DELETE FROM settings;
    DELETE FROM pending_mutations;
  `);
}

export { initializeDatabase } from '@/database/schema';
