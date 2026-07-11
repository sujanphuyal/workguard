import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PixelDotBackground } from '@/components/pixel';
import { useIsGuest } from '@/hooks/useUser';
import type { AppTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import { useAuthStore } from '@/store';

interface ScreenContainerProps {
  children: React.ReactNode;
  title?: string;
}

export function ScreenContainer({ children, title }: ScreenContainerProps) {
  const theme = useTheme<AppTheme>();
  const isOffline = useAuthStore((s) => s.isOffline);
  const isGuest = useIsGuest();

  return (
    <PixelDotBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {isGuest && (
          <View style={[styles.banner, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSecondaryContainer }}>
              Guest mode — data saved on this device only
            </Text>
          </View>
        )}
        {isOffline && !isGuest && (
          <View style={[styles.banner, { backgroundColor: theme.colors.errorContainer }]}>
            <Text variant="labelMedium" style={{ color: theme.colors.onErrorContainer }}>
              Offline — changes will sync when connected
            </Text>
          </View>
        )}
        {title ? (
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
            {title}
          </Text>
        ) : null}
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    </PixelDotBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  title: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  content: { flex: 1, paddingHorizontal: spacing.md },
});
