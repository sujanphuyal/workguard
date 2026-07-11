import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@/theme';
import { hairline, radius } from '@/theme/tokens';
import type { PreviewTheme } from '@/features/settings/services/previewThemeService';
import { triggerSelectionHaptic } from '@/utils/haptics';

interface ThemeToggleProps {
  value: PreviewTheme;
  onChange: (theme: PreviewTheme) => void;
}

export function ThemeToggle({ value, onChange }: ThemeToggleProps) {
  const theme = useTheme<AppTheme>();
  const isDark = value === 'dark';

  const handleToggle = () => {
    void triggerSelectionHaptic();
    onChange(isDark ? 'light' : 'dark');
  };

  return (
    <Pressable
      onPress={handleToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      style={[
        styles.track,
        {
          backgroundColor: theme.colors.surfaceVariant,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
            transform: [{ translateX: isDark ? 28 : 0 }],
          },
        ]}
      >
        <MaterialCommunityIcons
          name={isDark ? 'weather-night' : 'weather-sunny'}
          size={14}
          color={isDark ? theme.colors.primary : theme.colors.warning}
        />
      </View>
      <MaterialCommunityIcons
        name="weather-sunny"
        size={12}
        color={theme.colors.onSurfaceVariant}
        style={styles.sunHint}
      />
      <MaterialCommunityIcons
        name="weather-night"
        size={12}
        color={theme.colors.onSurfaceVariant}
        style={styles.moonHint}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 56,
    height: 28,
    borderRadius: radius.full,
    borderWidth: hairline,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunHint: {
    position: 'absolute',
    left: 7,
    opacity: 0.55,
  },
  moonHint: {
    position: 'absolute',
    right: 7,
    opacity: 0.55,
  },
});
