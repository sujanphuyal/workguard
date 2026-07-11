import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import { ScreenContainer } from '@/components';
import { ShiftSchedulePresetsEditor } from '@/features/settings/components/ShiftSchedulePresetsEditor';
import { loadUserSettings, saveSettings } from '@/features/settings/services/settingsService';
import { useEmployers } from '@/hooks/useCompliance';
import { useUserId } from '@/hooks/useUser';
import { useAuthStore } from '@/store';
import type { ShiftSchedulePreset } from '@/types';

export default function ShiftLabelsScreen() {
  const userId = useUserId();
  const settings = useAuthStore((s) => s.settings);
  const setSettings = useAuthStore((s) => s.setSettings);
  const { data: employers = [] } = useEmployers();

  const [loading, setLoading] = useState(!settings);
  const [shiftSchedules, setShiftSchedules] = useState<ShiftSchedulePreset[]>(
    settings?.shiftSchedules ?? [],
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const uid = userId;
    if (!uid || settings) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void loadUserSettings(uid)
      .then((loaded) => {
        if (!cancelled) {
          setSettings(loaded);
          setShiftSchedules(loaded.shiftSchedules);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load shift labels.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, settings, setSettings]);

  useEffect(() => {
    if (settings) {
      setShiftSchedules(settings.shiftSchedules);
    }
  }, [settings]);

  const persistSchedules = async (next: ShiftSchedulePreset[]) => {
    if (!settings) return;

    setShiftSchedules(next);
    setError(null);

    try {
      const updated = await saveSettings(settings, { shiftSchedules: next });
      setSettings(updated);
      setShiftSchedules(updated.shiftSchedules);
    } catch (e) {
      setShiftSchedules(settings.shiftSchedules);
      setError(e instanceof Error ? e.message : 'Failed to save shift label.');
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator style={styles.loader} />
      </ScreenContainer>
    );
  }

  if (!settings) {
    return (
      <ScreenContainer>
        <Text>Sign in to manage shift labels.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <ShiftSchedulePresetsEditor
          presets={shiftSchedules}
          employers={employers}
          onChange={persistSchedules}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  loader: { marginTop: 32 },
  error: { color: '#D32F2F', marginBottom: 12 },
});
