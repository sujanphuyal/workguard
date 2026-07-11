import * as Crypto from 'expo-crypto';

import { EMPLOYER_COLOURS } from '@/constants';
import { mapEmployerToDb } from '@/database/mappers';
import { employerRepository, shiftRepository } from '@/database/repositories';
import { syncService } from '@/services/syncService';
import type { Employer } from '@/types';

export interface EmployerInput {
  name: string;
  location?: string;
  position?: string;
  colour?: string;
  hourlyRate?: number;
}

function pickColour(userId: string): string {
  const count = employerRepository.findAll(userId).length;
  return EMPLOYER_COLOURS[count % EMPLOYER_COLOURS.length]!;
}

export class EmployerService {
  list(userId: string): Employer[] {
    return employerRepository.findAll(userId);
  }

  create(userId: string, input: EmployerInput): Employer {
    const name = input.name.trim();
    if (!name) throw new Error('Employer name is required.');

    const employer: Employer = {
      id: Crypto.randomUUID(),
      userId,
      name,
      location: input.location?.trim() || undefined,
      position: input.position?.trim() || undefined,
      colour: input.colour ?? pickColour(userId),
      hourlyRate: input.hourlyRate,
      createdAt: new Date(),
    };

    employerRepository.upsert(employer);
    void syncService.enqueueMutation('employers', 'insert', mapEmployerToDb(employer), userId);
    return employer;
  }

  update(employer: Employer, input: EmployerInput): Employer {
    const name = input.name.trim();
    if (!name) throw new Error('Employer name is required.');

    const updated: Employer = {
      ...employer,
      name,
      location: input.location?.trim() || undefined,
      position: input.position?.trim() || undefined,
      colour: input.colour ?? employer.colour,
      hourlyRate: input.hourlyRate,
    };

    employerRepository.upsert(updated);
    void syncService.enqueueMutation('employers', 'update', mapEmployerToDb(updated), employer.userId);
    return updated;
  }

  delete(id: string, userId: string): void {
    const linkedShifts = shiftRepository.findAll(userId, { employerId: id });
    if (linkedShifts.length > 0) {
      throw new Error('Reassign or delete shifts for this employer before removing it.');
    }
    employerRepository.delete(id);
    void syncService.enqueueMutation('employers', 'delete', { id }, userId);
  }
}

export const employerService = new EmployerService();

export function ensureDefaultEmployer(userId: string): Employer {
  const existing = employerRepository.findAll(userId);
  if (existing.length > 0) return existing[0]!;
  return employerService.create(userId, { name: 'My Employer' });
}
