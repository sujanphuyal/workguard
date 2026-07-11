/**
 * Web fallback — avoids loading expo-sqlite/wa-sqlite on web during Metro bundling.
 * Local persistence on web is limited; use iOS/Android for full offline support.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import { initializeDatabase } from '@/database/schema';

const webDb = {
  execSync(_sql: string, _params?: unknown[]) {
    // no-op on web stub
  },
  getAllSync<T>(_sql: string, ..._params: unknown[]): T[] {
    return [];
  },
  getFirstSync<T>(_sql: string, ..._params: unknown[]): T | null {
    return null;
  },
  runSync(_sql: string, ..._params: unknown[]) {
    // no-op on web stub
  },
} as unknown as SQLiteDatabase;

export function getDatabase(): SQLiteDatabase {
  return webDb;
}

export async function resetDatabase(): Promise<void> {
  // no-op
}

export { initializeDatabase };
