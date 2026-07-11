import { addWeeks, format, isSameDay, isToday } from 'date-fns';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';

import { getWeekDays } from '@/features/calendar/hooks/useCalendarShifts';
import type { AppTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import type { Employer, Shift } from '@/types';
import { formatHours, minutesToHours } from '@/utils/time';

interface CalendarWeekViewProps {
  weekAnchor: Date;
  selectedDay: Date;
  shiftsByDay: Map<string, Shift[]>;
  employerMap: Record<string, Employer>;
  violatingIds: Set<string>;
  onSelectDay: (day: Date) => void;
  onChangeWeek: (anchor: Date) => void;
}

export function CalendarWeekView({
  weekAnchor,
  selectedDay,
  shiftsByDay,
  employerMap,
  violatingIds,
  onSelectDay,
  onChangeWeek,
}: CalendarWeekViewProps) {
  const theme = useTheme<AppTheme>();
  const days = getWeekDays(weekAnchor);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <IconButton icon="chevron-left" onPress={() => onChangeWeek(addWeeks(weekAnchor, -1))} />
        <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
          {format(days[0]!, 'd MMM')} – {format(days[6]!, 'd MMM yyyy')}
        </Text>
        <IconButton icon="chevron-right" onPress={() => onChangeWeek(addWeeks(weekAnchor, 1))} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayShifts = shiftsByDay.get(key) ?? [];
          const selected = isSameDay(day, selectedDay);
          const today = isToday(day);

          return (
            <Pressable
              key={key}
              onPress={() => onSelectDay(day)}
              style={[
                styles.dayColumn,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
                selected && {
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}
            >
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600' }}
              >
                {format(day, 'EEE')}
              </Text>
              <Text
                variant="titleMedium"
                style={{
                  color: today ? theme.colors.primary : theme.colors.onSurface,
                  fontWeight: '700',
                  marginVertical: 4,
                }}
              >
                {format(day, 'd')}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {dayShifts.length > 0
                  ? `${formatHours(dayShifts.reduce((s, sh) => s + minutesToHours(sh.durationMinutes), 0))}h`
                  : '—'}
              </Text>
              <View style={styles.shiftList}>
                {dayShifts.slice(0, 4).map((shift) => (
                  <View
                    key={shift.id}
                    style={[
                      styles.shiftPill,
                      {
                        backgroundColor: violatingIds.has(shift.id)
                          ? `${theme.colors.violation}22`
                          : `${theme.colors.primary}18`,
                        borderLeftColor: employerMap[shift.employerId]?.colour ?? theme.colors.primary,
                      },
                    ]}
                  >
                    <Text variant="labelSmall" numberOfLines={1} style={{ color: theme.colors.onSurface }}>
                      {format(shift.startTime, 'HH:mm')}
                    </Text>
                  </View>
                ))}
                {dayShifts.length > 4 && (
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    +{dayShifts.length - 4} more
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
        Week view shows scheduled hours per day. Tap a day to see full details below.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strip: { marginTop: spacing.sm },
  dayColumn: {
    width: 108,
    minHeight: 160,
    marginRight: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  shiftList: { marginTop: spacing.sm, gap: 4, flex: 1 },
  shiftPill: {
    borderLeftWidth: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  hint: { marginTop: spacing.sm, lineHeight: 18 },
});
