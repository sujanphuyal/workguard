import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

import { KeyboardAwareScrollView, ScreenContainer } from '@/components';
import { changePassword } from '@/features/auth/services/authService';
import { useAuthStore } from '@/store';

export default function ChangePasswordScreen() {
  const profile = useAuthStore((s) => s.profile);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!profile?.email) return;
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await changePassword(profile.email, currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAwareScrollView includeHeaderOffset contentContainerStyle={styles.container}>
        <Text variant="bodyMedium" style={styles.intro}>
          Enter your current password, then choose a new one (minimum 8 characters).
        </Text>

        <TextInput
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
          style={styles.field}
        />
        <TextInput
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
          style={styles.field}
        />
        <TextInput
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          style={styles.field}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? (
          <Text style={styles.success}>Password updated successfully.</Text>
        ) : null}

        <View style={styles.actions}>
          <Button mode="contained" loading={loading} onPress={handleSave}>
            Update Password
          </Button>
          <Button mode="text" onPress={() => router.back()}>
            Cancel
          </Button>
        </View>
      </KeyboardAwareScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 32 },
  intro: { opacity: 0.85, marginBottom: 16, lineHeight: 22 },
  field: { marginVertical: 6 },
  error: { color: '#D32F2F', marginTop: 8 },
  success: { color: '#2E7D32', marginTop: 8 },
  actions: { marginTop: 24, gap: 8 },
});
