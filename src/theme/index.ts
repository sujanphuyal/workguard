import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';

import { md3Elevation, md3Palette, radius } from '@/theme/tokens';

const fontConfig = {
  fontFamily: 'System',
};

const sharedColors = {
  compliant: '#2E7D32',
  warning: '#ED6C02',
  violation: '#D32F2F',
};

export const lightTheme = {
  ...MD3LightTheme,
  roundness: radius.md,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: md3Palette.light.primary,
    onPrimary: md3Palette.light.onPrimary,
    primaryContainer: md3Palette.light.primaryContainer,
    onPrimaryContainer: md3Palette.light.onPrimaryContainer,
    secondary: md3Palette.light.secondary,
    onSecondary: md3Palette.light.onSecondary,
    secondaryContainer: md3Palette.light.secondaryContainer,
    onSecondaryContainer: md3Palette.light.onSecondaryContainer,
    tertiary: md3Palette.light.tertiary,
    onTertiary: md3Palette.light.onTertiary,
    tertiaryContainer: md3Palette.light.tertiaryContainer,
    onTertiaryContainer: md3Palette.light.onTertiaryContainer,
    error: md3Palette.light.error,
    onError: md3Palette.light.onError,
    errorContainer: md3Palette.light.errorContainer,
    onErrorContainer: md3Palette.light.onErrorContainer,
    background: md3Palette.light.background,
    onBackground: md3Palette.light.onBackground,
    surface: md3Palette.light.surface,
    onSurface: md3Palette.light.onSurface,
    surfaceVariant: md3Palette.light.surfaceVariant,
    onSurfaceVariant: md3Palette.light.onSurfaceVariant,
    outline: md3Palette.light.outline,
    outlineVariant: md3Palette.light.outlineVariant,
    inverseSurface: md3Palette.light.inverseSurface,
    inverseOnSurface: md3Palette.light.inverseOnSurface,
    inversePrimary: md3Palette.light.inversePrimary,
    shadow: md3Palette.light.shadow,
    scrim: md3Palette.light.scrim,
    elevation: md3Elevation.light,
    ...sharedColors,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  roundness: radius.md,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: md3Palette.dark.primary,
    onPrimary: md3Palette.dark.onPrimary,
    primaryContainer: md3Palette.dark.primaryContainer,
    onPrimaryContainer: md3Palette.dark.onPrimaryContainer,
    secondary: md3Palette.dark.secondary,
    onSecondary: md3Palette.dark.onSecondary,
    secondaryContainer: md3Palette.dark.secondaryContainer,
    onSecondaryContainer: md3Palette.dark.onSecondaryContainer,
    tertiary: md3Palette.dark.tertiary,
    onTertiary: md3Palette.dark.onTertiary,
    tertiaryContainer: md3Palette.dark.tertiaryContainer,
    onTertiaryContainer: md3Palette.dark.onTertiaryContainer,
    error: md3Palette.dark.error,
    onError: md3Palette.dark.onError,
    errorContainer: md3Palette.dark.errorContainer,
    onErrorContainer: md3Palette.dark.onErrorContainer,
    background: md3Palette.dark.background,
    onBackground: md3Palette.dark.onBackground,
    surface: md3Palette.dark.surface,
    onSurface: md3Palette.dark.onSurface,
    surfaceVariant: md3Palette.dark.surfaceVariant,
    onSurfaceVariant: md3Palette.dark.onSurfaceVariant,
    outline: md3Palette.dark.outline,
    outlineVariant: md3Palette.dark.outlineVariant,
    inverseSurface: md3Palette.dark.inverseSurface,
    inverseOnSurface: md3Palette.dark.inverseOnSurface,
    inversePrimary: md3Palette.dark.inversePrimary,
    shadow: md3Palette.dark.shadow,
    scrim: md3Palette.dark.scrim,
    elevation: md3Elevation.dark,
    ...sharedColors,
  },
};

export type AppTheme = typeof lightTheme;

declare global {
  namespace ReactNativePaper {
    interface MD3Colors {
      compliant: string;
      warning: string;
      violation: string;
    }
  }
}

export function getComplianceColor(
  status: 'compliant' | 'warning' | 'violation',
  theme: AppTheme,
): string {
  if (status === 'violation') return theme.colors.violation;
  if (status === 'warning') return theme.colors.warning;
  return theme.colors.compliant;
}

export {
  md3Palette,
  md3Elevation,
  spacing,
  radius,
  hairline,
  motion,
  cardShadow,
  iosPalette,
  pixelPalette,
  pixelRadius,
  pixelBorder,
  pixelSpacing,
  pixelMotion,
} from '@/theme/tokens';
