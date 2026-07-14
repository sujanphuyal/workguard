import { getDatabase } from '@/database/index';
import { mapDbEmployer, mapDbSemesterBreak, mapDbShift, mapLocalSettings, mapShiftToDb } from '@/database/mappers';
import { serializeShiftSchedules } from '@/features/settings/services/shiftSchedulePresets';
import type { Employer, SemesterBreak, Shift, ShiftFilter, UserSettings } from '@/types';

export class EmployerRepository {
  findAll(userId: string): Employer[] {
    const db = getDatabase();
    const rows = db.getAllSync<{
      id: string;
      user_id: string;
      name: string;
      location: string | null;
      position: string | null;
      colour: string;
      hourly_rate: number | null;
      created_at: string;
    }>('SELECT * FROM employers WHERE user_id = ? ORDER BY name ASC', userId);
    return rows.map(mapDbEmployer);
  }

  upsert(employer: Employer, syncStatus = 'pending'): void {
    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO employers (id, user_id, name, location, position, colour, hourly_rate, created_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      employer.id,
      employer.userId,
      employer.name,
      employer.location ?? null,
      employer.position ?? null,
      employer.colour,
      employer.hourlyRate ?? null,
      employer.createdAt.toISOString(),
      syncStatus,
    );
  }

  delete(id: string): void {
    getDatabase().runSync('DELETE FROM employers WHERE id = ?', id);
  }
}

export class ShiftRepository {
  findAll(userId: string, filter?: ShiftFilter): Shift[] {
    const db = getDatabase();
    let query = 'SELECT * FROM work_shifts WHERE user_id = ? AND deleted_at IS NULL';
    const params: (string | number)[] = [userId];

    if (filter?.employerId) {
      query += ' AND employer_id = ?';
      params.push(filter.employerId);
    }
    if (filter?.status) {
      query += ' AND status = ?';
      params.push(filter.status);
    }
    if (filter?.startDate) {
      query += ' AND start_time >= ?';
      params.push(filter.startDate.toISOString());
    }
    if (filter?.endDate) {
      query += ' AND end_time <= ?';
      params.push(filter.endDate.toISOString());
    }
    if (filter?.keyword) {
      query += ' AND notes LIKE ?';
      params.push(`%${filter.keyword}%`);
    }

    query += ' ORDER BY start_time DESC';

    const rows = db.getAllSync<Parameters<typeof mapDbShift>[0]>(query, ...params);
    let shifts = rows.map(mapDbShift);

    if (filter?.minHours !== undefined) {
      shifts = shifts.filter((s) => s.durationMinutes / 60 >= filter.minHours!);
    }
    if (filter?.maxHours !== undefined) {
      shifts = shifts.filter((s) => s.durationMinutes / 60 <= filter.maxHours!);
    }

    return shifts;
  }

  findById(id: string): Shift | null {
    const row = getDatabase().getFirstSync<Parameters<typeof mapDbShift>[0]>(
      'SELECT * FROM work_shifts WHERE id = ?',
      id,
    );
    return row ? mapDbShift(row) : null;
  }

  upsert(shift: Shift, syncStatus = 'pending'): void {
    const db = getDatabase();
    const data = mapShiftToDb(shift);
    db.runSync(
      `INSERT OR REPLACE INTO work_shifts
       (id, user_id, employer_id, status, start_time, end_time, duration_minutes, break_minutes, notes, recurrence_group_id, reminder_minutes, deleted_at, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.id as string,
      data.user_id as string,
      data.employer_id as string,
      data.status as string,
      data.start_time as string,
      data.end_time as string,
      data.duration_minutes as number,
      (data.break_minutes as number) ?? 0,
      data.notes as string | null,
      data.recurrence_group_id as string | null,
      data.reminder_minutes as number | null,
      data.deleted_at as string | null,
      data.created_at as string,
      data.updated_at as string,
      syncStatus,
    );
  }

  softDelete(id: string): void {
    const now = new Date().toISOString();
    getDatabase().runSync(
      "UPDATE work_shifts SET deleted_at = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?",
      now,
      now,
      id,
    );
  }

  count(userId: string): number {
    const row = getDatabase().getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM work_shifts WHERE user_id = ? AND deleted_at IS NULL',
      userId,
    );
    return row?.count ?? 0;
  }
}

export class SettingsRepository {
  findByUserId(userId: string): UserSettings | null {
    const row = getDatabase().getFirstSync<{
      user_id: string;
      notifications_enabled: number;
      theme: string;
      language: string;
      warning_percentage: number;
      max_hours: number;
      shift_schedules: string;
    }>('SELECT * FROM settings WHERE user_id = ?', userId);
    return row ? mapLocalSettings(row) : null;
  }

  upsert(settings: UserSettings): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    const existing = db.getFirstSync<{ created_at: string }>(
      'SELECT created_at FROM settings WHERE user_id = ?',
      settings.userId,
    );
    db.runSync(
      `INSERT OR REPLACE INTO settings
       (user_id, notifications_enabled, theme, language, warning_percentage, max_hours, shift_schedules, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      settings.userId,
      settings.notificationsEnabled ? 1 : 0,
      settings.theme,
      settings.language,
      settings.warningPercentage,
      settings.maxHours,
      serializeShiftSchedules(settings.shiftSchedules),
      existing?.created_at ?? now,
      now,
    );
  }
}

export class SemesterBreakRepository {
  findAll(userId: string): SemesterBreak[] {
    const rows = getDatabase().getAllSync<Parameters<typeof mapDbSemesterBreak>[0]>(
      'SELECT * FROM semester_breaks WHERE user_id = ? ORDER BY start_date ASC',
      userId,
    );
    return rows.map(mapDbSemesterBreak);
  }

  findById(id: string): SemesterBreak | null {
    const row = getDatabase().getFirstSync<Parameters<typeof mapDbSemesterBreak>[0]>(
      'SELECT * FROM semester_breaks WHERE id = ?',
      id,
    );
    return row ? mapDbSemesterBreak(row) : null;
  }

  upsert(breakItem: SemesterBreak, syncStatus = 'pending'): void {
    getDatabase().runSync(
      `INSERT OR REPLACE INTO semester_breaks (id, user_id, title, start_date, end_date, created_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      breakItem.id,
      breakItem.userId,
      breakItem.title,
      breakItem.startDate.toISOString().slice(0, 10),
      breakItem.endDate.toISOString().slice(0, 10),
      new Date().toISOString(),
      syncStatus,
    );
  }

  delete(id: string): void {
    getDatabase().runSync('DELETE FROM semester_breaks WHERE id = ?', id);
  }
}

export const employerRepository = new EmployerRepository();
export const shiftRepository = new ShiftRepository();
export const settingsRepository = new SettingsRepository();
export const semesterBreakRepository = new SemesterBreakRepository();
