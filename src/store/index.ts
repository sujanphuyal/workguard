import { create } from 'zustand';

import type { Profile, UserSettings } from '@/types';
import type { PreviewTheme } from '@/features/settings/services/previewThemeService';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  settings: UserSettings | null;
  localThemePreference: PreviewTheme;
  isGuest: boolean;
  isLoading: boolean;
  isOffline: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setSettings: (settings: UserSettings | null) => void;
  setLocalThemePreference: (theme: PreviewTheme) => void;
  setIsGuest: (isGuest: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsOffline: (offline: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  settings: null,
  localThemePreference: 'light',
  isGuest: false,
  isLoading: true,
  isOffline: false,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setSettings: (settings) => set({ settings }),
  setLocalThemePreference: (localThemePreference) => set({ localThemePreference }),
  setIsGuest: (isGuest) => set({ isGuest }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsOffline: (isOffline) => set({ isOffline }),
  reset: () =>
    set((state) => ({
      session: null,
      profile: null,
      settings: null,
      isGuest: false,
      isLoading: false,
      localThemePreference: state.localThemePreference,
    })),
}));

interface UIState {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedDate: new Date(),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
}));
