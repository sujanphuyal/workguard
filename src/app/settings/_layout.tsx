import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@/theme';

export default function SettingsLayout() {
  const theme = useTheme<AppTheme>();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { color: theme.colors.onSurface, fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="profile" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="change-password" options={{ title: 'Change Password' }} />
      <Stack.Screen name="employers" options={{ title: 'Employers' }} />
      <Stack.Screen name="shift-labels" options={{ title: 'Shift Labels' }} />
      <Stack.Screen name="app-settings" options={{ title: 'App Settings' }} />
      <Stack.Screen name="semester-breaks" options={{ title: 'Semester Breaks' }} />
    </Stack>
  );
}
