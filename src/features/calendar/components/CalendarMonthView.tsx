import { addMonths, format, isSameDay, isSameMonth, isToday } from 'date-fns';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';

import { getMonthGridDays } from '@/features/calendar/hooks/useCalendarShifts';
import type { AppTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import type { Shift } from '@/types';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface CalendarMonthViewProps {
  month: Date;
  selectedDay: Date;
  shiftsByDay: Map<string, Shift[]>;
  violatingIds: Set<string>;
  onSelectDay: (day: Date) => void;
  onChangeMonth: (month: Date) => void;
}

export function CalendarMonthView({
  month,
  selectedDay,
  shiftsByDay,
  violatingIds,
  onSelectDay,
  onChangeMonth,
}: CalendarMonthViewProps) {
  const theme = useTheme<AppTheme>();
  const days = getMonthGridDays(month);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <IconButton icon="chevron-left" onPress={() => onChangeMonth(addMonths(month, -1))} />
        <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
          {format(month, 'MMMM yyyy')}
        </Text>
        <IconButton icon="chevron-right" onPress={() => onChangeMonth(addMonths(month, 1))} />
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text
            key={label}
            variant="labelSmall"
            style={[styles.weekday, { color: theme.colors.onSurfaceVariant }]}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayShifts = shiftsByDay.get(key) ?? [];
          const hasViolation = dayShifts.some((s) => violatingIds.has(s.id));
          const inMonth = isSameMonth(day, month);
          const selected = isSameDay(day, selectedDay);
          const today = isToday(day);

          return (
            <Pressable
              key={key}
              onPress={() => onSelectDay(day)}
              style={[
                styles.cell,
                !inMonth && styles.outsideMonth,
                selected && {
                  borderColor: theme.colors.primary,
                  borderWidth: 2,
                  backgroundColor: theme.colors.primaryContainer,
                },
                !selected && dayShifts.length > 0 && {
                  backgroundColor: hasViolation
                    ? `${theme.colors.violation}18`
                    : `${theme.colors.primary}14`,
                },
              ]}
            >
              <Text
                variant="labelMedium"
                style={{
                  color: !inMonth
                    ? theme.colors.onSurfaceVariant
                    : today
                      ? theme.colors.primary
                      : theme.colors.onSurface,
                  fontWeight: today || selected ? '700' : '400',
                }}
              >
                {format(day, 'd')}
              </Text>
              {dayShifts.length > 0 && (
                <View style={styles.dots}>
                  {dayShifts.slice(0, 3).map((s) => (
                    <View
                      key={s.id}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: violatingIds.has(s.id)
                          ? theme.colors.violation
                          : theme.colors.primary,
                      }}
                    />
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
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
    borderRadius: radius.sm,
    marginBottom: 2,
    gap: 2,
  },
  outsideMonth: { opacity: 0.35 },
  dots: { flexDirection: 'row', gap: 2 },
});
