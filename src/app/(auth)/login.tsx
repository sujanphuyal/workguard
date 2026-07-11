import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo, PixelDotBackground } from '@/components';
import { ThemeToggle } from '@/components/ThemeToggle';
import { enterGuestMode, exitGuestMode } from '@/features/auth/services/guestService';
import {
  savePreviewTheme,
  type PreviewTheme,
} from '@/features/settings/services/previewThemeService';
import {
  getOAuthRedirectUri,
  signInWithEmail,
  signInWithGoogle,
} from '@/features/auth/services/authService';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { AppTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { useAuthStore } from '@/store';

export default function LoginScreen() {
  const theme = useTheme<AppTheme>();
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setSettings = useAuthStore((s) => s.setSettings);
  const setIsGuest = useAuthStore((s) => s.setIsGuest);
  const localTheme = useAuthStore((s) => s.localThemePreference);
  const setLocalThemePreference = useAuthStore((s) => s.setLocalThemePreference);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (__DEV__) {
      console.info(`[OAuth] Add to Supabase redirect URLs: ${getOAuthRedirectUri()}`);
    }
  }, []);

  const goToApp = () => {
    router.replace('/(tabs)');
  };

  const handleOAuthSuccess = async (session: Awaited<ReturnType<typeof signInWithGoogle>>) => {
    await exitGuestMode(false);
    setIsGuest(false);
    setSession(session);
    goToApp();
  };

  const handleGuest = async () => {
    setLoading(true);
    setError('');
    try {
      const { profile, settings } = await enterGuestMode();
      const previewTheme = useAuthStore.getState().localThemePreference;
      setSession(null);
      setIsGuest(true);
      setProfile(profile);
      setSettings({ ...settings, theme: previewTheme });
      goToApp();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start guest mode');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await exitGuestMode(false);
      setIsGuest(false);
      await signInWithEmail(email, password);
      goToApp();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle().then(handleOAuthSuccess);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const busy = loading || googleLoading;

  const handleThemeChange = async (next: PreviewTheme) => {
    setLocalThemePreference(next);
    await savePreviewTheme(next);
  };

  return (
    <PixelDotBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.themeToggleRow}>
          <ThemeToggle value={localTheme} onChange={handleThemeChange} />
        </View>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.header}>
            <AppLogo width={240} />
          </View>

          <Card mode="elevated" style={styles.card}>
            <Card.Content>
              {!isSupabaseConfigured && (
                <Text variant="bodySmall" style={[styles.warning, { color: theme.colors.warning }]}>
                  Supabase not configured — add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
                  to .env.local
                </Text>
              )}
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                mode="outlined"
                style={styles.input}
              />
              {error ? (
                <Text variant="bodySmall" style={[styles.error, { color: theme.colors.error }]}>
                  {error}
                </Text>
              ) : null}
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={busy}
                style={styles.signInButton}
              >
                Sign In
              </Button>
              <Button mode="outlined" onPress={handleGuest} loading={loading} disabled={busy}>
                Continue as Guest
              </Button>
              <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
                Guest mode stores data on this device only. Create an account later to sync across devices.
              </Text>
            </Card.Content>
          </Card>

          <View style={styles.orRow}>
            <Divider style={styles.dividerLine} />
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              or
            </Text>
            <Divider style={styles.dividerLine} />
          </View>

          <Button
            mode="outlined"
            icon="google"
            onPress={handleGoogle}
            loading={googleLoading}
            disabled={busy}
          >
            Continue with Google
          </Button>

          <View style={styles.links}>
            <Button mode="text" onPress={() => router.push('/(auth)/forgot-password')}>
              Forgot Password?
            </Button>
            <Button mode="text" onPress={() => router.push('/(auth)/register')}>
              Create Account
            </Button>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PixelDotBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  themeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  header: { marginBottom: spacing.sm, alignItems: 'center' },
  card: { marginBottom: 0 },
  warning: { marginBottom: spacing.sm, textAlign: 'center', lineHeight: 18 },
  input: { marginBottom: spacing.sm },
  signInButton: { marginBottom: spacing.md },
  hint: { textAlign: 'center', marginTop: spacing.sm, lineHeight: 18 },
  error: { marginBottom: spacing.sm, textAlign: 'center' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1 },
  links: { alignItems: 'center', marginTop: spacing.sm },
});
