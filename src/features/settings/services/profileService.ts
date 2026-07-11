import { mapDbProfile, mapProfileToDb } from '@/database/mappers';
import { isGuestUserId } from '@/features/auth/guestIds';
import { saveGuestProfile } from '@/features/auth/services/guestService';
import { supabase } from '@/lib/supabase';
import type { CourseType, Profile } from '@/types';

export interface ProfileUpdates {
  fullName?: string;
  university?: string;
  courseName?: string;
  courseType?: CourseType;
  courseCommencementDate?: Date | null;
  visaExpiry?: Date | null;
  timezone?: string;
}

export async function saveProfile(
  current: Profile,
  updates: ProfileUpdates,
): Promise<Profile> {
  const merged: Profile = {
    ...current,
    fullName: updates.fullName ?? current.fullName,
    university: updates.university ?? current.university,
    courseName: updates.courseName ?? current.courseName,
    courseType: updates.courseType ?? current.courseType,
    courseCommencementDate:
      updates.courseCommencementDate === null
        ? undefined
        : (updates.courseCommencementDate ?? current.courseCommencementDate),
    visaExpiry:
      updates.visaExpiry === null ? undefined : (updates.visaExpiry ?? current.visaExpiry),
    timezone: updates.timezone ?? current.timezone,
    updatedAt: new Date(),
  };

  if (isGuestUserId(current.id)) {
    return saveGuestProfile(merged);
  }

  const payload = mapProfileToDb(merged);
  delete payload.id;
  delete payload.email;
  delete payload.onboarding_completed;

  const { data, error } = await supabase
    .from('profiles')
    .update(payload as never)
    .eq('id', current.id)
    .select()
    .single();

  if (error) throw error;
  return mapDbProfile(data);
}
