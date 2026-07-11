import { StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { PixelPanel } from '@/components/pixel';
import type { AppTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

interface EmptyStateProps {
  title: string;
  message?: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  const theme = useTheme<AppTheme>();

  return (
    <PixelPanel elevated style={styles.container}>
      <Text variant="bodyLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      {message ? (
        <Text
          variant="bodySmall"
          style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
        >
          {message}
        </Text>
      ) : null}
    </PixelPanel>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xxl },
  title: { fontWeight: '600', textAlign: 'center' },
  message: { marginTop: spacing.sm, textAlign: 'center', lineHeight: 18 },
});
