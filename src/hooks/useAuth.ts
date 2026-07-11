import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import * as Network from 'expo-network';

import { restoreGuestMode } from '@/features/auth/services/guestService';
import {
  loadPreviewTheme,
} from '@/features/settings/services/previewThemeService';
import {
  completeOAuthFromUrl,
  isOAuthCallbackUrl,
  isOAuthFlowActive,
} from '@/features/auth/services/oauthService';
import { loadUserSettings } from '@/features/settings/services/settingsService';
import { mapDbProfile } from '@/database/mappers';
import { syncService } from '@/services/syncService';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import type { UserSettings } from '@/types';

async function mergeGuestSettings(settings: UserSettings): Promise<UserSettings> {
  const previewTheme = await loadPreviewTheme();
  const theme = settings.theme === 'system' ? previewTheme : settings.theme;
  return { ...settings, theme };
}

export function useAuthListener() {
  const { setSession, setProfile, setSettings, setIsGuest, setIsLoading, setIsOffline, setLocalThemePreference, reset } =
    useAuthStore();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadUserData = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (profile) setProfile(mapDbProfile(profile));
      } catch {
        // Profile may already be cached or unavailable offline
      }

      const settings = await loadUserSettings(userId);
      setSettings(settings);

      try {
        await syncService.pullFromRemote(userId);
      } catch {
        // Offline — continue with local data
      }
    };

    const init = async () => {
      try {
        const network = await Network.getNetworkStateAsync();
        setIsOffline(!network.isConnected);

        const previewTheme = await loadPreviewTheme();
        setLocalThemePreference(previewTheme);

        const { data } = await supabase.auth.getSession();
        setSession(data.session);

        if (data.session?.user) {
          const userId = data.session.user.id;
          setIsGuest(false);
          await loadUserData(userId);
          const { ensureDefaultEmployer } = await import('@/features/shifts/services/employerService');
          ensureDefaultEmployer(userId);
          unsubscribe = syncService.subscribeToChanges(userId, () => undefined);
        } else {
          const guest = await restoreGuestMode();
          if (guest) {
            setIsGuest(true);
            setProfile(guest.profile);
            setSettings(await mergeGuestSettings(guest.settings));
          }
        }
      } catch {
        // Continue with defaults so the app is not stuck on the splash screen.
      } finally {
        setIsLoading(false);
      }
    };

    void init();

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      if (!isOAuthCallbackUrl(url) || isOAuthFlowActive()) return;
      void completeOAuthFromUrl(url).catch(() => undefined);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (!session) {
        const guest = await restoreGuestMode();
        if (guest) {
          setIsGuest(true);
          setProfile(guest.profile);
          setSettings(await mergeGuestSettings(guest.settings));
          return;
        }
        reset();
        unsubscribe?.();
        return;
      }
      setIsGuest(false);
      await loadUserData(session.user.id);
    });

    return () => {
      linkingSubscription.remove();
      listener.subscription.unsubscribe();
      unsubscribe?.();
    };
  }, [reset, setIsGuest, setIsLoading, setIsOffline, setLocalThemePreference, setProfile, setSession, setSettings]);
}

export function useNetworkStatus() {
  const setIsOffline = useAuthStore((s) => s.setIsOffline);

  useEffect(() => {
    const interval = setInterval(async () => {
      const network = await Network.getNetworkStateAsync();
      setIsOffline(!network.isConnected);
      if (network.isConnected) {
        await syncService.syncPendingMutations();
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [setIsOffline]);
}
