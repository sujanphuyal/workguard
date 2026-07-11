import { format, isSameDay } from 'date-fns';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import { EmptyState, ScreenContainer, ShiftCard } from '@/components';
import { CalendarMonthView } from '@/features/calendar/components/CalendarMonthView';
import {
  useScheduledShifts,
  useShiftsByDay,
} from '@/features/calendar/hooks/useCalendarShifts';
import {
  useEmployers,
  useShifts,
  useViolatingShiftIds,
} from '@/hooks/useCompliance';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';
import type { AppTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { formatHours } from '@/utils/time';

export default function CalendarScreen() {
  const theme = useTheme<AppTheme>();
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [monthAnchor, setMonthAnchor] = useState(new Date());

  const { data: shifts = [] } = useShifts();
  const { data: employers = [] } = useEmployers();
  const violatingIds = useViolatingShiftIds();

  const { scrollPaddingBottom } = useTabBarLayout();

  const scheduled = useScheduledShifts(shifts);
  const shiftsByDay = useShiftsByDay(scheduled);
  const employerMap = Object.fromEntries(employers.map((e) => [e.id, e]));

  const dayShifts = useMemo(
    () => scheduled.filter((s) => isSameDay(s.startTime, selectedDay)),
    [scheduled, selectedDay],
  );

  const dayTotal = dayShifts.reduce((sum, s) => sum + s.durationMinutes / 60, 0);

  const handleSelectDay = (day: Date) => {
    setSelectedDay(day);
    setMonthAnchor(day);
  };

  return (
    <ScreenContainer title="Calendar">
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPaddingBottom }]}>
        <Text variant="bodySmall" style={[styles.gap, { color: theme.colors.onSurfaceVariant }]}>
          {scheduled.length} scheduled shift{scheduled.length === 1 ? '' : 's'} tracked
        </Text>

        <CalendarMonthView
          month={monthAnchor}
          selectedDay={selectedDay}
          shiftsByDay={shiftsByDay}
          violatingIds={violatingIds}
          onSelectDay={handleSelectDay}
          onChangeMonth={setMonthAnchor}
        />

        <Text
          variant="titleSmall"
          style={[styles.dayTitle, { color: theme.colors.onSurface }]}
        >
          {format(selectedDay, 'EEEE, d MMMM')} · {formatHours(dayTotal)} scheduled
        </Text>

        {dayShifts.length === 0 ? (
          <EmptyState title="No scheduled shifts this day" />
        ) : (
          dayShifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              employer={employerMap[shift.employerId]}
              violatesLimit={violatingIds.has(shift.id)}
              onPress={() => router.push(`/shift/${shift.id}`)}
            />
          ))
        )}

        <Button
          mode="outlined"
          icon="file-import"
          onPress={() => router.push('/import')}
          style={styles.importButton}
        >
          Import roster
        </Button>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  gap: { marginBottom: spacing.md },
  dayTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  importButton: { marginTop: spacing.lg },
});
