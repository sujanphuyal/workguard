import { format, isToday, isTomorrow, startOfDay } from 'date-fns';
import { SectionList, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { groupShiftsByDate } from '@/features/calendar/hooks/useCalendarShifts';
import type { AppTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import type { Employer, Shift } from '@/types';
import { formatHours, minutesToHours } from '@/utils/time';

interface CalendarAgendaViewProps {
  scheduled: Shift[];
  employerMap: Record<string, Employer>;
  violatingIds: Set<string>;
  onSelectDay: (day: Date) => void;
}

function sectionTitle(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, d MMMM');
}

export function CalendarAgendaView({
  scheduled,
  employerMap,
  violatingIds,
  onSelectDay,
}: CalendarAgendaViewProps) {
  const theme = useTheme<AppTheme>();
  const fromToday = scheduled.filter((s) => s.startTime >= startOfDay(new Date()));
  const groups = groupShiftsByDate(fromToday);

  if (groups.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
          No upcoming scheduled shifts
        </Text>
      </View>
    );
  }

  const sections = groups.map((g) => ({
    title: sectionTitle(g.date),
    date: g.date,
    data: g.shifts,
  }));

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderSectionHeader={({ section }) => (
        <Text
          variant="titleSmall"
          style={[styles.sectionHeader, { color: theme.colors.onSurface }]}
          onPress={() => onSelectDay(section.date)}
        >
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => {
        const employer = employerMap[item.employerId];
        const violates = violatingIds.has(item.id);
        return (
          <View
            style={[
              styles.row,
              {
                backgroundColor: theme.colors.surface,
                borderLeftColor: employer?.colour ?? theme.colors.primary,
              },
              violates && { backgroundColor: `${theme.colors.violation}12` },
            ]}
          >
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, width: 52 }}>
              {format(item.startTime, 'HH:mm')}
            </Text>
            <View style={styles.rowBody}>
              <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                {employer?.name ?? 'Employer'}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {format(item.startTime, 'HH:mm')} – {format(item.endTime, 'HH:mm')} ·{' '}
                {formatHours(minutesToHours(item.durationMinutes))}h
                {violates ? ' · Over limit' : ''}
              </Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  sectionHeader: { fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: 8,
    borderLeftWidth: 4,
    gap: spacing.sm,
  },
  rowBody: { flex: 1, gap: 2 },
  empty: { paddingVertical: spacing.md },
});
