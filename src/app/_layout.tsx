import '@/lib/i18n';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider, useTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';

import { useAuthListener, useNetworkStatus } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store';
import { darkTheme, lightTheme, type AppTheme } from '@/theme';
import type { ThemePreference } from '@/types';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { session, profile, isLoading, isGuest } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const { session: currentSession, profile: currentProfile, isGuest: guestActive } =
      useAuthStore.getState();

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const isSignedIn = Boolean(currentSession) || guestActive;

    if (!isSignedIn && !inAuth) {
      router.replace('/(auth)/login');
    } else if (isSignedIn && inAuth) {
      if (currentSession && currentProfile && !currentProfile.onboardingCompleted) {
        router.replace('/(onboarding)');
      } else {
        router.replace('/(tabs)');
      }
    } else if (currentSession && currentProfile && !currentProfile.onboardingCompleted && !inOnboarding) {
      router.replace('/(onboarding)');
    } else if (isSignedIn && currentProfile?.onboardingCompleted && (inAuth || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [session, profile, isLoading, isGuest, segments, router]);

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  return children;
}

function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: ReturnType<typeof useColorScheme>,
): 'light' | 'dark' {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return systemScheme === 'dark' ? 'dark' : 'light';
}

function ThemedNavigation() {
  const theme = useTheme<AppTheme>();

  return (
    <AuthGate>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen
          name="shift/[id]"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Edit Shift',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.primary,
            headerTitleStyle: { color: theme.colors.onSurface, fontWeight: '600' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        />
        <Stack.Screen
          name="shift/new"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'New Shift',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.primary,
            headerTitleStyle: { color: theme.colors.onSurface, fontWeight: '600' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        />
        <Stack.Screen
          name="import"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Import Roster',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.primary,
            headerTitleStyle: { color: theme.colors.onSurface, fontWeight: '600' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        />
      </Stack>
    </AuthGate>
  );
}

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const settingsTheme = useAuthStore((s) => s.settings?.theme);
  const localTheme = useAuthStore((s) => s.localThemePreference);
  const session = useAuthStore((s) => s.session);
  const isGuest = useAuthStore((s) => s.isGuest);

  const themePreference: ThemePreference = useMemo(() => {
    const signedOut = !session && !isGuest;
    if (signedOut) return localTheme ?? 'light';
    return settingsTheme ?? localTheme ?? 'light';
  }, [session, isGuest, settingsTheme, localTheme]);

  const scheme = resolveColorScheme(themePreference, systemScheme);
  const paperTheme = useMemo(
    () => (scheme === 'dark' ? darkTheme : lightTheme),
    [scheme],
  );

  useAuthListener();
  useNetworkStatus();

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={paperTheme}>
            <ThemedNavigation />
          </PaperProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
