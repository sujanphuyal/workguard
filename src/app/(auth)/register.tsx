import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo, KeyboardAwareScrollView, PixelDotBackground } from '@/components';
import { signUpWithEmail } from '@/features/auth/services/authService';
import type { AppTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export default function RegisterScreen() {
  const theme = useTheme<AppTheme>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      await signUpWithEmail(email, password, fullName);
      router.replace('/(onboarding)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PixelDotBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAwareScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <AppLogo width={220} />
            <Text variant="headlineSmall" style={{ color: theme.colors.onBackground }}>
              Create Account
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Sync your shifts across devices with a WorkGuard account
            </Text>
          </View>

          <Card mode="elevated">
            <Card.Content>
              <TextInput
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                mode="outlined"
                style={styles.input}
              />
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
              <Button mode="contained" onPress={handleRegister} loading={loading}>
                Create Account
              </Button>
            </Card.Content>
          </Card>

          <Button mode="text" onPress={() => router.push('/(auth)/login')}>
            Already have an account? Sign In
          </Button>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </PixelDotBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  header: { marginBottom: spacing.sm, gap: spacing.sm, alignItems: 'center' },
  input: { marginBottom: spacing.sm },
  error: { marginBottom: spacing.sm, textAlign: 'center' },
});
