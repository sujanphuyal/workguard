import * as Crypto from 'expo-crypto';

import { getDatabase } from '@/database/index';
import { mapDbEmployer, mapDbSemesterBreak, mapDbShift, mapShiftToDb } from '@/database/mappers';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { isGuestUserId } from '@/features/auth/guestIds';
import { SYNC_BATCH_SIZE } from '@/constants';
import type { SyncOperation } from '@/types';

export class SyncService {
  private syncing = false;

  async enqueueMutation(
    table: string,
    operation: SyncOperation,
    payload: Record<string, unknown>,
    clientId: string,
  ): Promise<void> {
    if (isGuestUserId(clientId)) {
      return;
    }
    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO pending_mutations (id, table_name, operation, payload, client_id, created_at, retry_count)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      Crypto.randomUUID(),
      table,
      operation,
      JSON.stringify(payload),
      clientId,
      new Date().toISOString(),
    );
    await this.syncPendingMutations();
  }

  async syncPendingMutations(): Promise<void> {
    if (!isSupabaseConfigured || this.syncing) return;
    this.syncing = true;
    try {
      const db = getDatabase();
      const pending = db.getAllSync<{
        id: string;
        table_name: string;
        operation: string;
        payload: string;
        retry_count: number;
      }>('SELECT * FROM pending_mutations ORDER BY created_at ASC LIMIT 50');

      for (const mutation of pending) {
        const payload = JSON.parse(mutation.payload) as Record<string, unknown>;
        try {
          if (mutation.table_name === 'work_shifts') {
            await this.syncShift(mutation.operation as SyncOperation, payload);
          } else if (mutation.table_name === 'employers') {
            await this.syncEmployer(mutation.operation as SyncOperation, payload);
          } else if (mutation.table_name === 'semester_breaks') {
            await this.syncBreak(mutation.operation as SyncOperation, payload);
          }
          db.runSync('DELETE FROM pending_mutations WHERE id = ?', mutation.id);
        } catch {
          db.runSync(
            'UPDATE pending_mutations SET retry_count = retry_count + 1 WHERE id = ?',
            mutation.id,
          );
        }
      }
    } finally {
      this.syncing = false;
    }
  }

  private async syncShift(operation: SyncOperation, payload: Record<string, unknown>) {
    if (operation === 'delete') {
      await supabase
        .from('work_shifts')
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', payload.id as string);
      return;
    }
    await supabase.from('work_shifts').upsert(payload as never);
  }

  private async syncEmployer(operation: SyncOperation, payload: Record<string, unknown>) {
    if (operation === 'delete') {
      await supabase.from('employers').delete().eq('id', payload.id as string);
      return;
    }
    await supabase.from('employers').upsert(payload as never);
  }

  private async syncBreak(operation: SyncOperation, payload: Record<string, unknown>) {
    if (operation === 'delete') {
      await supabase.from('semester_breaks').delete().eq('id', payload.id as string);
      return;
    }
    await supabase.from('semester_breaks').upsert(payload as never);
  }

  async pullFromRemote(userId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const db = getDatabase();

    const { data: employers } = await supabase.from('employers').select('*').eq('user_id', userId);
    employers?.forEach((row) => {
      const employer = mapDbEmployer(row);
      db.runSync(
        `INSERT OR REPLACE INTO employers (id, user_id, name, location, position, colour, hourly_rate, created_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
        employer.id,
        employer.userId,
        employer.name,
        employer.location ?? null,
        employer.position ?? null,
        employer.colour,
        employer.hourlyRate ?? null,
        employer.createdAt.toISOString(),
      );
    });

    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const { data: shifts } = await supabase
        .from('work_shifts')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('start_time', { ascending: false })
        .range(offset, offset + SYNC_BATCH_SIZE - 1);

      if (!shifts?.length) {
        hasMore = false;
        break;
      }

      for (const row of shifts) {
        const shift = mapDbShift(row);
        const data = mapShiftToDb(shift);
        db.runSync(
          `INSERT OR REPLACE INTO work_shifts
           (id, user_id, employer_id, status, start_time, end_time, duration_minutes, break_minutes, notes, recurrence_group_id, deleted_at, created_at, updated_at, sync_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
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
          data.deleted_at as string | null,
          data.created_at as string,
          data.updated_at as string,
        );
      }

      offset += SYNC_BATCH_SIZE;
      hasMore = shifts.length === SYNC_BATCH_SIZE;
    }

    const { data: breaks } = await supabase
      .from('semester_breaks')
      .select('*')
      .eq('user_id', userId);
    breaks?.forEach((row) => {
      const br = mapDbSemesterBreak(row);
      db.runSync(
        `INSERT OR REPLACE INTO semester_breaks (id, user_id, title, start_date, end_date, created_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, 'synced')`,
        br.id,
        br.userId,
        br.title,
        br.startDate.toISOString().slice(0, 10),
        br.endDate.toISOString().slice(0, 10),
        new Date().toISOString(),
      );
    });
  }

  subscribeToChanges(userId: string, onChange: () => void): () => void {
    if (!isSupabaseConfigured) return () => undefined;
    const channel = supabase
      .channel(`sync-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_shifts', filter: `user_id=eq.${userId}` },
        () => {
          void this.pullFromRemote(userId).then(onChange);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employers', filter: `user_id=eq.${userId}` },
        () => {
          void this.pullFromRemote(userId).then(onChange);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }
}

export const syncService = new SyncService();
