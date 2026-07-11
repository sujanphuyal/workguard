import {
    DEFAULT_TIMEZONE,
    GUEST_MODE_STORAGE_KEY,
    GUEST_PROFILE_STORAGE_KEY,
    GUEST_USER_ID,
} from '@/constants';
import { clearGuestLocalData } from '@/features/auth/services/guestDataService';
import { createDefaultSettings, loadUserSettings } from '@/features/settings/services/settingsService';
import { ensureDefaultEmployer } from '@/features/shifts/services/employerService';
import { secureStorage } from '@/lib/secureStorage';
import type { Profile, UserSettings } from '@/types';

export { isGuestUserId } from '@/features/auth/guestIds';

function createDefaultGuestProfile(): Profile {
  const now = new Date();
  return {
    id: GUEST_USER_ID,
    fullName: 'Guest',
    email: 'guest@local.workguard',
    courseType: 'bachelors',
    timezone: DEFAULT_TIMEZONE,
    onboardingCompleted: true,
    createdAt: now,
    updatedAt: now,
  };
}

function parseStoredProfile(raw: string): Profile {
  const parsed = JSON.parse(raw) as Profile;
  return {
    ...parsed,
    courseCommencementDate: parsed.courseCommencementDate
      ? new Date(parsed.courseCommencementDate)
      : undefined,
    visaExpiry: parsed.visaExpiry ? new Date(parsed.visaExpiry) : undefined,
    createdAt: new Date(parsed.createdAt),
    updatedAt: new Date(parsed.updatedAt),
  };
}

export async function loadGuestProfile(): Promise<Profile> {
  const raw = await secureStorage.getItem(GUEST_PROFILE_STORAGE_KEY);
  if (raw) {
    try {
      return parseStoredProfile(raw);
    } catch {
      // fall through to default
    }
  }
  return createDefaultGuestProfile();
}

export async function saveGuestProfile(profile: Profile): Promise<Profile> {
  await secureStorage.setItem(GUEST_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  return profile;
}

export async function enterGuestMode(): Promise<{ profile: Profile; settings: UserSettings }> {
  await secureStorage.setItem(GUEST_MODE_STORAGE_KEY, 'true');

  let profile = await loadGuestProfile();
  if (!profile.onboardingCompleted) {
    profile = { ...profile, onboardingCompleted: true };
    await saveGuestProfile(profile);
  }

  let settings = await loadUserSettings(GUEST_USER_ID);
  if (!settings) {
    settings = createDefaultSettings(GUEST_USER_ID);
  }

  ensureDefaultEmployer(GUEST_USER_ID);

  return { profile, settings };
}

export async function restoreGuestMode(): Promise<{
  profile: Profile;
  settings: UserSettings;
} | null> {
  const flag = await secureStorage.getItem(GUEST_MODE_STORAGE_KEY);
  if (flag !== 'true') return null;

  const profile = await loadGuestProfile();
  const settings = await loadUserSettings(GUEST_USER_ID);
  ensureDefaultEmployer(GUEST_USER_ID);

  return { profile, settings };
}

export async function exitGuestMode(clearData = false): Promise<void> {
  await secureStorage.removeItem(GUEST_MODE_STORAGE_KEY);
  await secureStorage.removeItem(GUEST_PROFILE_STORAGE_KEY);

  if (clearData) {
    clearGuestLocalData();
  }
}
