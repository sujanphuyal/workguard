import * as Crypto from 'expo-crypto';

import { shiftRepository } from '@/database/repositories';
import { mapShiftToDb } from '@/database/mappers';
import { listRecurrenceStarts } from '@/features/shifts/services/repeatOptions';
import { resolveValidReminder } from '@/features/shifts/services/reminderOptions';
import { validateShift } from '@/rules/VisaRuleEngine';
import { syncService } from '@/services/syncService';
import { useAuthStore } from '@/store';
import type { RecurrenceConfig, Shift, ShiftFilter, UserContext } from '@/types';
import { calculateNetDurationMinutes } from '@/utils/time';

export interface ShiftInput {
  employerId: string;
  status: Shift['status'];
  startTime: Date;
  endTime: Date;
  breakMinutes?: number;
  notes?: string;
  recurrenceGroupId?: string;
  reminderMinutes?: number | null;
}

function resolveShiftTiming(input: Pick<ShiftInput, 'startTime' | 'endTime' | 'breakMinutes'>) {
  const breakMinutes = Math.max(0, Math.round(input.breakMinutes ?? 0));
  const durationMinutes = calculateNetDurationMinutes(
    input.startTime,
    input.endTime,
    breakMinutes,
  );
  return { breakMinutes, durationMinutes };
}

function notificationsEnabled(): boolean {
  return useAuthStore.getState().settings?.notificationsEnabled ?? true;
}

async function syncReminder(shift: Shift): Promise<void> {
  try {
    const { scheduleShiftReminder } = await import(
      '@/features/notifications/services/notificationService'
    );
    await scheduleShiftReminder(shift, notificationsEnabled());
  } catch (error) {
    console.warn('[shifts] Reminder schedule failed', error);
  }
}

async function clearReminder(shiftId: string): Promise<void> {
  try {
    const { cancelShiftReminder } = await import(
      '@/features/notifications/services/notificationService'
    );
    await cancelShiftReminder(shiftId);
  } catch {
    // Ignore cancel failures so deletes never break.
  }
}

export class ShiftService {
  list(userId: string, filter?: ShiftFilter): Shift[] {
    return shiftRepository.findAll(userId, filter);
  }

  getById(id: string): Shift | null {
    return shiftRepository.findById(id);
  }

  create(userId: string, input: ShiftInput, existingShifts: Shift[], context: UserContext): Shift {
    const { breakMinutes, durationMinutes } = resolveShiftTiming(input);
    const now = new Date();
    const reminderMinutes = resolveValidReminder(input.reminderMinutes ?? null, input.startTime);
    const shift: Shift = {
      id: Crypto.randomUUID(),
      userId,
      employerId: input.employerId,
      status: input.status,
      startTime: input.startTime,
      endTime: input.endTime,
      durationMinutes,
      breakMinutes,
      notes: input.notes,
      recurrenceGroupId: input.recurrenceGroupId,
      reminderMinutes,
      createdAt: now,
      updatedAt: now,
    };

    const errors = validateShift(shift, existingShifts, context);
    if (errors.length > 0) {
      throw new Error(errors[0]!.message);
    }

    shiftRepository.upsert(shift);
    void syncService.enqueueMutation('work_shifts', 'insert', mapShiftToDb(shift), userId);
    void syncReminder(shift);
    return shift;
  }

  update(
    shift: Shift,
    updates: Partial<ShiftInput>,
    existingShifts: Shift[],
    context: UserContext,
  ): Shift {
    const startTime = updates.startTime ?? shift.startTime;
    const endTime = updates.endTime ?? shift.endTime;
    const reminderSource =
      updates.reminderMinutes !== undefined ? updates.reminderMinutes : shift.reminderMinutes;
    const reminderMinutes = resolveValidReminder(reminderSource ?? null, startTime);

    const updated: Shift = {
      ...shift,
      ...updates,
      startTime,
      endTime,
      breakMinutes: updates.breakMinutes ?? shift.breakMinutes,
      reminderMinutes,
      updatedAt: new Date(),
    };
    const timing = resolveShiftTiming(updated);
    updated.breakMinutes = timing.breakMinutes;
    updated.durationMinutes = timing.durationMinutes;

    const errors = validateShift(updated, existingShifts, context);
    if (errors.length > 0) {
      throw new Error(errors[0]!.message);
    }

    shiftRepository.upsert(updated);
    void syncService.enqueueMutation('work_shifts', 'update', mapShiftToDb(updated), shift.userId);
    void syncReminder(updated);
    return updated;
  }

  delete(id: string, userId: string): void {
    shiftRepository.softDelete(id);
    void syncService.enqueueMutation('work_shifts', 'delete', { id }, userId);
    void clearReminder(id);
  }

  /**
   * Creates the first shift, then additional occurrences until endDate.
   * Returns all created shifts (first + expansions).
   */
  createWithRepeat(
    userId: string,
    input: ShiftInput,
    config: RecurrenceConfig | null,
    existingShifts: Shift[],
    context: UserContext,
  ): Shift[] {
    if (!config) {
      return [this.create(userId, input, existingShifts, context)];
    }

    const groupId = Crypto.randomUUID();
    const first = this.create(
      userId,
      { ...input, recurrenceGroupId: groupId },
      existingShifts,
      context,
    );
    const created: Shift[] = [first];
    const expansions = listRecurrenceStarts(input.startTime, input.endTime, config);

    for (const occurrence of expansions) {
      try {
        const next = this.create(
          userId,
          {
            ...input,
            startTime: occurrence.start,
            endTime: occurrence.end,
            recurrenceGroupId: groupId,
            reminderMinutes: resolveValidReminder(input.reminderMinutes ?? null, occurrence.start),
          },
          [...existingShifts, ...created],
          context,
        );
        created.push(next);
      } catch {
        // Skip occurrence that fails validation (e.g. overlap) and continue the series.
      }
    }

    return created;
  }

  /**
   * Updates the given shift, then creates future occurrences if a repeat config is set.
   * Returns the updated base shift plus any newly created occurrences.
   */
  updateWithRepeat(
    shift: Shift,
    updates: Partial<ShiftInput>,
    config: RecurrenceConfig | null,
    existingShifts: Shift[],
    context: UserContext,
  ): Shift[] {
    const groupId =
      config != null ? (shift.recurrenceGroupId ?? Crypto.randomUUID()) : shift.recurrenceGroupId;

    const updated = this.update(
      shift,
      {
        ...updates,
        recurrenceGroupId: groupId,
      },
      existingShifts,
      context,
    );

    if (!config) {
      return [updated];
    }

    const created: Shift[] = [updated];
    const expansions = listRecurrenceStarts(updated.startTime, updated.endTime, config);
    const known = existingShifts.filter((s) => s.id !== shift.id);

    for (const occurrence of expansions) {
      try {
        const next = this.create(
          shift.userId,
          {
            employerId: updated.employerId,
            status: updated.status,
            startTime: occurrence.start,
            endTime: occurrence.end,
            breakMinutes: updated.breakMinutes,
            notes: updated.notes,
            reminderMinutes: resolveValidReminder(updated.reminderMinutes ?? null, occurrence.start),
            recurrenceGroupId: groupId,
          },
          [...known, ...created],
          context,
        );
        created.push(next);
      } catch {
        // Skip invalid occurrences (overlap/duplicate) and continue.
      }
    }

    return created;
  }

  expandRecurrence(
    userId: string,
    input: ShiftInput,
    config: RecurrenceConfig,
    existingShifts: Shift[],
    context: UserContext,
  ): Shift[] {
    return this.createWithRepeat(userId, input, config, existingShifts, context);
  }
}

export const shiftService = new ShiftService();
