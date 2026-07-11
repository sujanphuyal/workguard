import { StyleSheet, View } from 'react-native';
import { Chip, Text, useTheme } from 'react-native-paper';
import { format } from 'date-fns';

import { PixelPanel } from '@/components/pixel';
import type { AppTheme } from '@/theme';
import type { Employer, Shift } from '@/types';
import { formatHours, minutesToHours } from '@/utils/time';

interface ShiftCardProps {
  shift: Shift;
  employer?: Employer;
  onPress?: () => void;
  /** Scheduled shift falls within a future rolling window that exceeds the limit */
  violatesLimit?: boolean;
}

export function ShiftCard({ shift, employer, onPress, violatesLimit }: ShiftCardProps) {
  const theme = useTheme<AppTheme>();

  const statusColor = (() => {
    if (violatesLimit && shift.status === 'scheduled') return theme.colors.violation;
    switch (shift.status) {
      case 'worked':
        return theme.colors.compliant;
      case 'scheduled':
        return theme.colors.primary;
      case 'cancelled':
        return theme.colors.onSurfaceVariant;
      case 'missed':
        return theme.colors.violation;
      default:
        return theme.colors.primary;
    }
  })();

  const chipLabel =
    violatesLimit && shift.status === 'scheduled' ? 'violation' : shift.status;

  const breakNote =
    shift.breakMinutes > 0 ? ` · ${shift.breakMinutes}m break` : '';

  return (
    <PixelPanel
      onPress={onPress}
      selected={violatesLimit && shift.status === 'scheduled'}
      elevated
    >
      <View style={styles.row}>
        <View
          style={[
            styles.dot,
            { backgroundColor: employer?.colour ?? theme.colors.primary },
          ]}
        />
        <View style={styles.content}>
          <Text variant="titleMedium">{employer?.name ?? 'Unknown employer'}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {format(shift.startTime, 'EEE d MMM, HH:mm')} —{' '}
            {format(shift.endTime, 'HH:mm')} · {formatHours(minutesToHours(shift.durationMinutes))}h
            worked{breakNote}
          </Text>
        </View>
        <Chip
          compact
          textStyle={[styles.chipText, { color: theme.colors.onPrimary }]}
          style={{ backgroundColor: statusColor }}
        >
          {chipLabel}
        </Chip>
      </View>
    </PixelPanel>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: { flex: 1, gap: 2 },
  chipText: {
    fontWeight: '500',
    fontSize: 11,
    textTransform: 'capitalize',
  },
});
