import { getDatabase } from '@/database/index';
import { GUEST_USER_ID } from '@/constants';

export function clearGuestLocalData(): void {
  const db = getDatabase();
  db.runSync('DELETE FROM work_shifts WHERE user_id = ?', GUEST_USER_ID);
  db.runSync('DELETE FROM employers WHERE user_id = ?', GUEST_USER_ID);
  db.runSync('DELETE FROM semester_breaks WHERE user_id = ?', GUEST_USER_ID);
  db.runSync('DELETE FROM settings WHERE user_id = ?', GUEST_USER_ID);
  db.runSync(
    "DELETE FROM pending_mutations WHERE client_id = ? OR payload LIKE ?",
    GUEST_USER_ID,
    `%${GUEST_USER_ID}%`,
  );
}
