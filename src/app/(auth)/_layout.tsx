import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@/theme';

export default function AuthLayout() {
  const theme = useTheme<AppTheme>();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: true,
          title: 'Reset Password',
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerShadowVisible: false,
          headerTitleStyle: { color: theme.colors.onSurface, fontWeight: '700' },
          headerTintColor: theme.colors.primary,
        }}
      />
    </Stack>
  );
}
