import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@/theme';

interface PixelDotBackgroundProps {
  children: React.ReactNode;
}

/** MD3 screen background using theme surface color. */
export function PixelDotBackground({ children }: PixelDotBackgroundProps) {
  const theme = useTheme<AppTheme>();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
