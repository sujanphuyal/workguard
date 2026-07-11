import { PREVIEW_THEME_STORAGE_KEY } from '@/constants';
import { secureStorage } from '@/lib/secureStorage';
import type { ThemePreference } from '@/types';

export type PreviewTheme = Extract<ThemePreference, 'light' | 'dark'>;

export async function loadPreviewTheme(): Promise<PreviewTheme> {
  const raw = await secureStorage.getItem(PREVIEW_THEME_STORAGE_KEY);
  return raw === 'dark' ? 'dark' : 'light';
}

export async function savePreviewTheme(theme: PreviewTheme): Promise<void> {
  await secureStorage.setItem(PREVIEW_THEME_STORAGE_KEY, theme);
}
