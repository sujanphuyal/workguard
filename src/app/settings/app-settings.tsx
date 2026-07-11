import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Switch, Text, TextInput } from 'react-native-paper';

import { KeyboardAwareScrollView, ScreenContainer } from '@/components';
import { DEFAULT_MAX_HOURS } from '@/constants';
import { THEME_OPTIONS } from '@/features/settings/constants';
import { loadUserSettings, saveSettings } from '@/features/settings/services/settingsService';
import { useUserId } from '@/hooks/useUser';
import { useAuthStore } from '@/store';
import type { ThemePreference, UserSettings } from '@/types';

export default function AppSettingsScreen() {
  const userId = useUserId();
  const settings = useAuthStore((s) => s.settings);
  const setSettings = useAuthStore((s) => s.setSettings);

  const [loadingSettings, setLoadingSettings] = useState(!settings);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    settings?.notificationsEnabled ?? true,
  );
  const [theme, setTheme] = useState<ThemePreference>(settings?.theme ?? 'light');
  const [warningPercentage, setWarningPercentage] = useState(
    settings?.warningPercentage ?? 80,
  );
  const [maxHours, setMaxHours] = useState(String(settings?.maxHours ?? DEFAULT_MAX_HOURS));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const uid = userId;
    if (!uid || settings) {
      setLoadingSettings(false);
      return;
    }

    let cancelled = false;
    setLoadingSettings(true);
    void loadUserSettings(uid)
      .then((loaded) => {
        if (!cancelled) {
          setSettings(loaded);
          setNotificationsEnabled(loaded.notificationsEnabled);
          setTheme(loaded.theme);
          setWarningPercentage(loaded.warningPercentage);
          setMaxHours(String(loaded.maxHours));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load settings. Defaults are shown — try saving again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSettings(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, settings, setSettings]);

  useEffect(() => {
    if (!settings) return;
    setNotificationsEnabled(settings.notificationsEnabled);
    setTheme(settings.theme);
    setWarningPercentage(settings.warningPercentage);
    setMaxHours(String(settings.maxHours));
  }, [settings]);

  const parsedMaxHours = useMemo(() => {
    const parsed = parseInt(maxHours.replace(/\D/g, ''), 10);
    return Number.isNaN(parsed) ? DEFAULT_MAX_HOURS : parsed;
  }, [maxHours]);

  const activeSettings: UserSettings | null = settings ?? (userId
    ? {
        userId,
        notificationsEnabled,
        theme,
        language: 'en',
        warningPercentage,
        maxHours: parsedMaxHours,
        shiftSchedules: [],
      }
    : null);

  const previewSettings = useMemo((): UserSettings | null => {
    if (!activeSettings) return null;
    return {
      ...activeSettings,
      notificationsEnabled,
      theme,
      warningPercentage,
      maxHours: parsedMaxHours,
    };
  }, [activeSettings, notificationsEnabled, theme, warningPercentage, parsedMaxHours]);

  if (loadingSettings) {
    return (
      <ScreenContainer>
        <ActivityIndicator style={styles.loader} />
      </ScreenContainer>
    );
  }

  if (!activeSettings) {
    return (
      <ScreenContainer>
        <Text>Sign in to manage app settings.</Text>
      </ScreenContainer>
    );
  }

  const applySettingsPreview = (
    patch: Partial<
      Pick<UserSettings, 'notificationsEnabled' | 'theme' | 'warningPercentage' | 'maxHours'>
    >,
  ) => {
    if (!previewSettings) return;
    setSettings({ ...previewSettings, ...patch });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!previewSettings || !activeSettings) return;

    if (parsedMaxHours < 1) {
      setError('Fortnightly hour limit must be at least 1.');
      return;
    }

    setSettings(previewSettings);
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await saveSettings(activeSettings, {
        notificationsEnabled,
        theme,
        warningPercentage,
        maxHours: parsedMaxHours,
      });
      setSettings(updated);
      setMaxHours(String(updated.maxHours));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAwareScrollView includeHeaderOffset contentContainerStyle={styles.container}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Fortnightly hour limit
        </Text>
        <TextInput
          label="Max hours (fortnight)"
          value={maxHours}
          onChangeText={(text) => {
            setMaxHours(text.replace(/\D/g, ''));
            setSaved(false);
          }}
          keyboardType="number-pad"
          mode="outlined"
          style={styles.field}
          right={<TextInput.Affix text="hours" />}
        />

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text variant="titleMedium">Notifications</Text>
            <Text variant="bodySmall">Compliance alerts and roster reminders</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={(value) => {
              setNotificationsEnabled(value);
              applySettingsPreview({ notificationsEnabled: value });
            }}
          />
        </View>

        <Text variant="labelMedium" style={styles.label}>
          Theme
        </Text>
        <SegmentedButtons
          value={theme}
          onValueChange={(v) => {
            const next = v as ThemePreference;
            setTheme(next);
            applySettingsPreview({ theme: next });
          }}
          buttons={THEME_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          style={styles.field}
        />

        <Text variant="labelMedium" style={styles.label}>
          Warning threshold ({warningPercentage}%)
        </Text>
        <Text variant="bodySmall" style={styles.hint}>
          Show a warning when projected hours exceed this percentage of your fortnightly limit.
        </Text>
        <SegmentedButtons
          value={String(warningPercentage)}
          onValueChange={(v) => setWarningPercentage(Number(v))}
          buttons={[
            { value: '70', label: '70%' },
            { value: '80', label: '80%' },
            { value: '90', label: '90%' },
          ]}
          style={styles.field}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {saved ? <Text style={styles.success}>Settings saved.</Text> : null}

        <View style={styles.actions}>
          <Button mode="contained" loading={loading} onPress={handleSave}>
            Save Settings
          </Button>
        </View>
      </KeyboardAwareScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 32 },
  loader: { marginTop: 32 },
  sectionTitle: { marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  rowText: { flex: 1, paddingRight: 16 },
  field: { marginVertical: 8 },
  label: { marginTop: 16 },
  hint: { opacity: 0.7, marginBottom: 4, lineHeight: 20 },
  error: { color: '#D32F2F', marginTop: 8 },
  success: { color: '#2E7D32', marginTop: 8 },
  actions: { marginTop: 24, gap: 8 },
});
