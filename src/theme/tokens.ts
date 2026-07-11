import { Easing, Platform } from 'react-native';

/** Material Design 3 spacing scale (4dp grid) */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** MD3 shape — corner radius tokens */
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 28,
  full: 9999,
} as const;

export const hairline = Platform.select({ ios: 0.5, default: 1 }) ?? 1;

export const motion = {
  duration: {
    fast: 150,
    normal: 250,
    emphasized: 400,
  },
  easing: Easing.bezier(0.2, 0, 0, 1),
} as const;

/** Material Design 3 color roles (WorkGuard teal seed) */
export const md3Palette = {
  light: {
    primary: '#006A6A',
    onPrimary: '#FFFFFF',
    primaryContainer: '#6FF7F6',
    onPrimaryContainer: '#002020',
    secondary: '#4A6363',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#CCE8E7',
    onSecondaryContainer: '#051F1F',
    tertiary: '#456179',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#CCE5FF',
    onTertiaryContainer: '#001E31',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    background: '#FAFDFC',
    onBackground: '#191C1C',
    surface: '#FAFDFC',
    onSurface: '#191C1C',
    surfaceVariant: '#DAE5E4',
    onSurfaceVariant: '#3F4948',
    outline: '#6F7978',
    outlineVariant: '#BEC9C8',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F4F7F6',
    surfaceContainer: '#EEF1F0',
    surfaceContainerHigh: '#E8EBEA',
    surfaceContainerHighest: '#E2E5E4',
    inverseSurface: '#2D3131',
    inverseOnSurface: '#EFF1F0',
    inversePrimary: '#4CDADA',
    shadow: '#000000',
    scrim: '#000000',
  },
  dark: {
    primary: '#4CDADA',
    onPrimary: '#003737',
    primaryContainer: '#004F4F',
    onPrimaryContainer: '#6FF7F6',
    secondary: '#B0CCCC',
    onSecondary: '#1B3534',
    secondaryContainer: '#324B4B',
    onSecondaryContainer: '#CCE8E7',
    tertiary: '#AECAE6',
    onTertiary: '#0F344B',
    tertiaryContainer: '#2D4A63',
    onTertiaryContainer: '#CCE5FF',
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    background: '#0E1413',
    onBackground: '#E0E3E2',
    surface: '#0E1413',
    onSurface: '#E0E3E2',
    surfaceVariant: '#3F4948',
    onSurfaceVariant: '#BEC9C8',
    outline: '#889392',
    outlineVariant: '#3F4948',
    surfaceContainerLowest: '#0A0F0F',
    surfaceContainerLow: '#191C1C',
    surfaceContainer: '#1D2020',
    surfaceContainerHigh: '#272B2A',
    surfaceContainerHighest: '#323635',
    inverseSurface: '#E0E3E2',
    inverseOnSurface: '#2D3131',
    inversePrimary: '#006A6A',
    shadow: '#000000',
    scrim: '#000000',
  },
} as const;

/** MD3 elevation — tonal surface overlays */
export const md3Elevation = {
  light: {
    level0: 'transparent',
    level1: md3Palette.light.surfaceContainerLow,
    level2: md3Palette.light.surfaceContainer,
    level3: md3Palette.light.surfaceContainerHigh,
    level4: md3Palette.light.surfaceContainerHighest,
    level5: md3Palette.light.surfaceContainerHighest,
  },
  dark: {
    level0: 'transparent',
    level1: md3Palette.dark.surfaceContainerLow,
    level2: md3Palette.dark.surfaceContainer,
    level3: md3Palette.dark.surfaceContainerHigh,
    level4: md3Palette.dark.surfaceContainerHighest,
    level5: md3Palette.dark.surfaceContainerHighest,
  },
} as const;

export const cardShadow = Platform.select({
  android: { elevation: 1 },
  default: {},
}) as object;

/** @deprecated Use md3Palette */
export const iosPalette = {
  light: {
    background: md3Palette.light.background,
    surface: md3Palette.light.surface,
    surfaceSecondary: md3Palette.light.surfaceContainer,
    separator: md3Palette.light.outlineVariant,
    label: md3Palette.light.onBackground,
    secondaryLabel: md3Palette.light.onSurfaceVariant,
    tertiaryLabel: md3Palette.light.outline,
    primary: md3Palette.light.primary,
    fill: md3Palette.light.surfaceContainerHigh,
  },
  dark: {
    background: md3Palette.dark.background,
    surface: md3Palette.dark.surface,
    surfaceSecondary: md3Palette.dark.surfaceContainer,
    separator: md3Palette.dark.outlineVariant,
    label: md3Palette.dark.onBackground,
    secondaryLabel: md3Palette.dark.onSurfaceVariant,
    tertiaryLabel: md3Palette.dark.outline,
    primary: md3Palette.dark.primary,
    fill: md3Palette.dark.surfaceContainerHigh,
  },
};

export const pixelSpacing = spacing;
export const pixelRadius = { sm: radius.sm, md: radius.md, lg: radius.lg };
export const pixelBorder = { width: hairline, widthStrong: 1 };
export const pixelMotion = motion;
export const pixelPalette = {
  light: {
    background: md3Palette.light.background,
    surface: md3Palette.light.surface,
    surfaceElevated: md3Palette.light.surfaceContainerLow,
    border: md3Palette.light.outlineVariant,
    borderFocus: md3Palette.light.primary,
    dot: md3Palette.light.onBackground,
    text: md3Palette.light.onBackground,
    textMuted: md3Palette.light.onSurfaceVariant,
    primary: md3Palette.light.primary,
    primaryGlow: 'transparent',
    accent: md3Palette.light.tertiary,
  },
  dark: {
    background: md3Palette.dark.background,
    surface: md3Palette.dark.surface,
    surfaceElevated: md3Palette.dark.surfaceContainerLow,
    border: md3Palette.dark.outlineVariant,
    borderFocus: md3Palette.dark.primary,
    dot: md3Palette.dark.onBackground,
    text: md3Palette.dark.onBackground,
    textMuted: md3Palette.dark.onSurfaceVariant,
    primary: md3Palette.dark.primary,
    primaryGlow: 'transparent',
    accent: md3Palette.dark.tertiary,
  },
};
