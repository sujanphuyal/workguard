import * as Crypto from 'expo-crypto';

import { mapSemesterBreakToDb } from '@/database/mappers';
import { semesterBreakRepository } from '@/database/repositories';
import { syncService } from '@/services/syncService';
import type { SemesterBreak } from '@/types';

export interface SemesterBreakInput {
  title: string;
  startDate: Date;
  endDate: Date;
}

function validateInput(input: SemesterBreakInput): void {
  if (!input.title.trim()) {
    throw new Error('Break title is required.');
  }
  if (input.endDate < input.startDate) {
    throw new Error('End date must be on or after start date.');
  }
}

export class SemesterBreakService {
  list(userId: string): SemesterBreak[] {
    return semesterBreakRepository.findAll(userId);
  }

  create(userId: string, input: SemesterBreakInput): SemesterBreak {
    validateInput(input);
    const breakItem: SemesterBreak = {
      id: Crypto.randomUUID(),
      userId,
      title: input.title.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
    };
    semesterBreakRepository.upsert(breakItem);
    void syncService.enqueueMutation(
      'semester_breaks',
      'insert',
      mapSemesterBreakToDb(breakItem),
      userId,
    );
    return breakItem;
  }

  update(existing: SemesterBreak, input: SemesterBreakInput): SemesterBreak {
    validateInput(input);
    const updated: SemesterBreak = {
      ...existing,
      title: input.title.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
    };
    semesterBreakRepository.upsert(updated);
    void syncService.enqueueMutation(
      'semester_breaks',
      'update',
      mapSemesterBreakToDb(updated),
      existing.userId,
    );
    return updated;
  }

  delete(id: string, userId: string): void {
    semesterBreakRepository.delete(id);
    void syncService.enqueueMutation('semester_breaks', 'delete', { id }, userId);
  }
}

export const semesterBreakService = new SemesterBreakService();
