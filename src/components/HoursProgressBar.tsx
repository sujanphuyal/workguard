import { View, StyleSheet } from 'react-native';
import { ProgressBar, Text, useTheme } from 'react-native-paper';

import type { ComplianceStatus } from '@/types';
import { getComplianceColor, type AppTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

interface HoursProgressBarProps {
  current: number;
  max: number;
  status: ComplianceStatus;
}

export function HoursProgressBar({ current, max, status }: HoursProgressBarProps) {
  const theme = useTheme<AppTheme>();
  const progress = max > 0 ? Math.min(current / max, 1) : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.labels}>
        <Text variant="titleSmall" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
          Rolling 14-day period
        </Text>
        <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {current.toFixed(1)} / {max}h
        </Text>
      </View>
      <ProgressBar
        progress={progress}
        color={getComplianceColor(status, theme)}
        style={[styles.bar, { backgroundColor: theme.colors.surfaceVariant }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  bar: { height: 6, borderRadius: radius.full },
});
