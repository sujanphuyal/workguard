import { mapDbSettings, mapSettingsToDb } from '@/database/mappers';
import { settingsRepository } from '@/database/repositories';
import { DEFAULT_MAX_HOURS, DEFAULT_WARNING_PERCENTAGE } from '@/constants';
import { isGuestUserId } from '@/features/auth/guestIds';
import { serializeShiftSchedules } from '@/features/settings/services/shiftSchedulePresets';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { ShiftSchedulePreset, ThemePreference, UserSettings } from '@/types';

export interface SettingsUpdates {
  notificationsEnabled?: boolean;
  theme?: ThemePreference;
  language?: string;
  warningPercentage?: number;
  maxHours?: number;
  shiftSchedules?: ShiftSchedulePreset[];
}

export function createDefaultSettings(userId: string): UserSettings {
  return {
    userId,
    notificationsEnabled: true,
    theme: 'light',
    language: 'en',
    warningPercentage: DEFAULT_WARNING_PERCENTAGE,
    maxHours: DEFAULT_MAX_HOURS,
    shiftSchedules: [],
  };
}

export async function loadUserSettings(userId: string): Promise<UserSettings> {
  const cached = settingsRepository.findByUserId(userId);
  if (cached) return cached;

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        const settings = mapDbSettings(data);
        settingsRepository.upsert(settings);
        return settings;
      }

      const defaults = createDefaultSettings(userId);
      const now = new Date().toISOString();
      const { data: created, error } = await supabase
        .from('settings')
        .upsert({
          ...(mapSettingsToDb(defaults) as Record<string, unknown>),
          created_at: now,
          updated_at: now,
        } as never)
        .select()
        .single();

      if (!error && created) {
        const settings = mapDbSettings(created);
        settingsRepository.upsert(settings);
        return settings;
      }
    } catch {
      // Fall through to local defaults
    }
  }

  const defaults = createDefaultSettings(userId);
  settingsRepository.upsert(defaults);
  return defaults;
}

export async function saveSettings(
  current: UserSettings,
  updates: SettingsUpdates,
): Promise<UserSettings> {
  const merged: UserSettings = {
    ...current,
    notificationsEnabled: updates.notificationsEnabled ?? current.notificationsEnabled,
    theme: updates.theme ?? current.theme,
    language: updates.language ?? current.language,
    warningPercentage: updates.warningPercentage ?? current.warningPercentage,
    maxHours: updates.maxHours ?? current.maxHours,
    shiftSchedules: updates.shiftSchedules ?? current.shiftSchedules,
  };

  settingsRepository.upsert(merged);

  if (!isSupabaseConfigured || isGuestUserId(merged.userId)) {
    return merged;
  }

  const now = new Date().toISOString();
  const remoteFields = {
    notifications_enabled: merged.notificationsEnabled,
    theme: merged.theme,
    language: merged.language,
    warning_percentage: merged.warningPercentage,
    max_hours: merged.maxHours,
    shift_schedules: serializeShiftSchedules(merged.shiftSchedules),
    updated_at: now,
  };

  const { data: updated, error: updateError } = await supabase
    .from('settings')
    .update(remoteFields as never)
    .eq('user_id', merged.userId)
    .select()
    .maybeSingle();

  if (!updateError && updated) {
    const saved = mapDbSettings(updated);
    settingsRepository.upsert(saved);
    return saved;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('settings')
    .insert({
      user_id: merged.userId,
      ...remoteFields,
      created_at: now,
    } as never)
    .select()
    .maybeSingle();

  if (!insertError && inserted) {
    const saved = mapDbSettings(inserted);
    settingsRepository.upsert(saved);
    return saved;
  }

  // Local save succeeded; don't block the user if remote sync fails.
  return merged;
}
