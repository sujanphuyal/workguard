import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

import { KeyboardAwareScrollView } from '@/components';
import { resetPassword } from '@/features/auth/services/authService';
import { spacing } from '@/theme/tokens';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      await resetPassword(email);
      setMessage('Password reset email sent.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView includeHeaderOffset contentContainerStyle={styles.container}>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        mode="outlined"
        style={styles.input}
      />
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Button mode="contained" onPress={handleReset} loading={loading}>
        Send Reset Link
      </Button>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  input: { marginBottom: spacing.sm },
  message: { marginBottom: spacing.sm },
});
