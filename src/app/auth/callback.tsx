import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import {
  completeOAuthFromUrl,
  isOAuthFlowActive,
} from '@/features/auth/services/oauthService';
import { useAuthStore } from '@/store';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const finish = async (url: string) => {
      try {
        const session = await completeOAuthFromUrl(url);
        if (cancelled) return;
        setSession(session);
        if (!isOAuthFlowActive()) {
          router.replace('/(tabs)');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Sign-in failed');
        }
      }
    };

    void Linking.getInitialURL().then((url) => {
      if (url) void finish(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void finish(url);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [router, setSession]);

  if (isOAuthFlowActive()) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          <ActivityIndicator size="large" />
          <Text style={styles.text}>Completing sign-in…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { marginTop: 16, opacity: 0.8 },
  error: { color: '#D32F2F', textAlign: 'center' },
});
