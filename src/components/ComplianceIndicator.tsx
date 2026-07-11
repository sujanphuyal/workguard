import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { format } from 'date-fns';

import type { ComplianceResult, ComplianceStatus } from '@/types';
import { getComplianceColor, type AppTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { formatHours } from '@/utils/time';

interface ComplianceIndicatorProps {
  status: ComplianceStatus;
  currentHours: number;
  maxHours: number;
  remainingHours: number;
  isUnlimited?: boolean;
  compliance?: ComplianceResult | null;
}

export function ComplianceIndicator({
  status,
  currentHours,
  maxHours,
  remainingHours,
  isUnlimited,
  compliance,
}: ComplianceIndicatorProps) {
  const theme = useTheme<AppTheme>();
  const color = getComplianceColor(status, theme);
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  const displayHours = compliance?.peakProjectedHours ?? currentHours;
  const showPeak =
    compliance &&
    !compliance.isUnlimited &&
    compliance.peakProjectedHours > compliance.projectedHours;

  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Content style={styles.container}>
        <View style={[styles.ring, { borderColor: color }]}>
          <Text variant="headlineSmall" style={{ color, fontWeight: '600' }}>
            {isUnlimited ? '∞' : `${formatHours(displayHours)} / ${maxHours}`}
          </Text>
          <Text variant="titleMedium" style={{ color, marginTop: spacing.xs }}>
            {isUnlimited ? 'Unlimited' : label}
          </Text>
        </View>
        {!isUnlimited && (
          <>
            <Text variant="bodyLarge" style={[styles.remaining, { color: theme.colors.onSurface }]}>
              {formatHours(remainingHours)} hours remaining
            </Text>
            {showPeak && (
              <Text
                variant="bodySmall"
                style={[styles.peakNote, { color: theme.colors.onSurfaceVariant }]}
              >
                Peak rolling 14-day window: {formatHours(compliance.peakProjectedHours)}h (through{' '}
                {format(compliance.peakWindowEnd, 'd MMM')})
              </Text>
            )}
            {compliance?.hasFutureWindowViolation && (
              <Text variant="bodySmall" style={[styles.peakNote, { color: theme.colors.violation }]}>
                A future fortnight exceeds the limit — scheduled shifts are affected.
              </Text>
            )}
          </>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: spacing.sm },
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  ring: {
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remaining: {
    marginTop: spacing.md,
  },
  peakNote: {
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
    lineHeight: 18,
  },
});
