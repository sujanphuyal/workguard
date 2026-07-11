import { addMonths, format, isSameDay, isSameMonth, isToday } from 'date-fns';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';

import { getMonthGridDays } from '@/features/calendar/hooks/useCalendarShifts';
import type { AppTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface InlineCalendarFieldProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
}

export function InlineCalendarField({ label, value, onChange, minimumDate }: InlineCalendarFieldProps) {
  const theme = useTheme<AppTheme>();
  const [monthAnchor, setMonthAnchor] = useState(value);
  const days = getMonthGridDays(monthAnchor);
  const minTime = minimumDate ? new Date(minimumDate).setHours(0, 0, 0, 0) : null;

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
      ) : null}

      <View style={styles.header}>
        <IconButton icon="chevron-left" onPress={() => setMonthAnchor(addMonths(monthAnchor, -1))} />
        <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
          {format(monthAnchor, 'MMMM yyyy')}
        </Text>
        <IconButton icon="chevron-right" onPress={() => setMonthAnchor(addMonths(monthAnchor, 1))} />
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((day) => (
          <Text
            key={day}
            variant="labelSmall"
            style={[styles.weekday, { color: theme.colors.onSurfaceVariant }]}
          >
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, monthAnchor);
          const selected = isSameDay(day, value);
          const today = isToday(day);
          const disabled = minTime !== null && day.getTime() < minTime;

          return (
            <Pressable
              key={key}
              disabled={disabled}
              onPress={() => onChange(day)}
              style={[
                styles.cell,
                !inMonth && styles.outsideMonth,
                disabled && styles.disabled,
                selected && {
                  backgroundColor: theme.colors.primary,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Text
                variant="labelMedium"
                style={{
                  color: selected
                    ? theme.colors.onPrimary
                    : !inMonth
                      ? theme.colors.onSurfaceVariant
                      : today
                        ? theme.colors.primary
                        : theme.colors.onSurface,
                  fontWeight: today || selected ? '700' : '400',
                }}
              >
                {format(day, 'd')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: spacing.xs },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  weekdayRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekday: { width: '14.28%', textAlign: 'center', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  outsideMonth: { opacity: 0.35 },
  disabled: { opacity: 0.25 },
});
