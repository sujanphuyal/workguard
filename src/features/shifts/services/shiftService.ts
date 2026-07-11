import * as Crypto from 'expo-crypto';
import { addDays, addMonths, addWeeks } from 'date-fns';

import { shiftRepository } from '@/database/repositories';
import { mapShiftToDb } from '@/database/mappers';
import { validateShift } from '@/rules/VisaRuleEngine';
import { syncService } from '@/services/syncService';
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
      createdAt: now,
      updatedAt: now,
    };

    const errors = validateShift(shift, existingShifts, context);
    if (errors.length > 0) {
      throw new Error(errors[0]!.message);
    }

    shiftRepository.upsert(shift);
    void syncService.enqueueMutation('work_shifts', 'insert', mapShiftToDb(shift), userId);
    return shift;
  }

  update(
    shift: Shift,
    updates: Partial<ShiftInput>,
    existingShifts: Shift[],
    context: UserContext,
  ): Shift {
    const updated: Shift = {
      ...shift,
      ...updates,
      startTime: updates.startTime ?? shift.startTime,
      endTime: updates.endTime ?? shift.endTime,
      breakMinutes: updates.breakMinutes ?? shift.breakMinutes,
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
    return updated;
  }

  delete(id: string, userId: string): void {
    shiftRepository.softDelete(id);
    void syncService.enqueueMutation('work_shifts', 'delete', { id }, userId);
  }

  duplicate(shift: Shift, existingShifts: Shift[], context: UserContext): Shift {
    const offset = 7 * 24 * 60 * 60 * 1000;
    return this.create(
      shift.userId,
      {
        employerId: shift.employerId,
        status: shift.status,
        startTime: new Date(shift.startTime.getTime() + offset),
        endTime: new Date(shift.endTime.getTime() + offset),
        breakMinutes: shift.breakMinutes,
        notes: shift.notes,
      },
      existingShifts,
      context,
    );
  }

  expandRecurrence(
    userId: string,
    input: ShiftInput,
    config: RecurrenceConfig,
    existingShifts: Shift[],
    context: UserContext,
  ): Shift[] {
    const groupId = Crypto.randomUUID();
    const created: Shift[] = [];
    let currentStart = input.startTime;
    let currentEnd = input.endTime;
    let count = 0;
    const maxOccurrences = config.occurrences ?? 365;

    while (currentStart <= config.endDate && count < maxOccurrences) {
      const shift = this.create(
        userId,
        {
          ...input,
          startTime: currentStart,
          endTime: currentEnd,
          recurrenceGroupId: groupId,
        },
        [...existingShifts, ...created],
        context,
      );
      created.push(shift);
      count += 1;

      if (config.frequency === 'weekly') {
        currentStart = addWeeks(currentStart, config.interval);
        currentEnd = addWeeks(currentEnd, config.interval);
      } else if (config.frequency === 'fortnightly') {
        currentStart = addWeeks(currentStart, 2 * config.interval);
        currentEnd = addWeeks(currentEnd, 2 * config.interval);
      } else if (config.frequency === 'monthly') {
        currentStart = addMonths(currentStart, config.interval);
        currentEnd = addMonths(currentEnd, config.interval);
      } else {
        currentStart = addDays(currentStart, config.interval);
        currentEnd = addDays(currentEnd, config.interval);
      }
    }

    return created;
  }
}

export const shiftService = new ShiftService();
