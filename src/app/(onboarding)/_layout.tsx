import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@/theme';

export default function OnboardingLayout() {
  const theme = useTheme<AppTheme>();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
