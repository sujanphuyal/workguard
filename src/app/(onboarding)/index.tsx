import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Checkbox, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PixelDotBackground } from '@/components';
import { LEGAL_DISCLAIMER } from '@/constants';
import { updateProfile } from '@/features/auth/services/authService';
import type { AppTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { useAuthStore } from '@/store';

export default function OnboardingScreen() {
  const theme = useTheme<AppTheme>();
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const session = useAuthStore((s) => s.session);
  const setProfile = useAuthStore((s) => s.setProfile);
  const profile = useAuthStore((s) => s.profile);

  const handleContinue = async () => {
    if (!session?.user.id) return;
    setLoading(true);
    try {
      await updateProfile(session.user.id, { onboarding_completed: true });
      if (profile) {
        setProfile({ ...profile, onboardingCompleted: true });
      }
      router.replace('/(tabs)');
    } catch {
      if (profile) {
        setProfile({ ...profile, onboardingCompleted: true });
      }
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PixelDotBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text
            variant="headlineSmall"
            style={[styles.title, { color: theme.colors.onBackground }]}
          >
            Legal Disclaimer
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.disclaimer, { color: theme.colors.onSurface }]}
          >
            {LEGAL_DISCLAIMER}
          </Text>
          <Checkbox.Item
            label="I understand and acknowledge"
            labelStyle={{ color: theme.colors.onSurface }}
            status={acknowledged ? 'checked' : 'unchecked'}
            onPress={() => setAcknowledged(!acknowledged)}
          />
          <Button
            mode="contained"
            disabled={!acknowledged}
            loading={loading}
            onPress={handleContinue}
          >
            Continue to WorkGuard
          </Button>
        </ScrollView>
      </SafeAreaView>
    </PixelDotBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, flexGrow: 1 },
  title: { marginBottom: spacing.md, fontWeight: '600' },
  disclaimer: { lineHeight: 22, marginBottom: spacing.lg },
});
