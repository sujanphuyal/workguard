import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Menu, Text, useTheme } from 'react-native-paper';

import { ScreenContainer } from '@/components';
import { RosterImpactPlanner } from '@/features/analytics/components/RosterImpactPlanner';
import { ShiftRangeFilter } from '@/features/shifts/components/ShiftRangeFilter';
import { useEmployers, useShifts } from '@/hooks/useCompliance';
import type { AppTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import {
  filterShiftsInRange,
  resolveShiftRange,
  type ShiftRangePreset,
} from '@/utils/shiftFilters';
import { formatHours } from '@/utils/time';

export default function AnalyticsScreen() {
  const theme = useTheme<AppTheme>();
  const { data: shifts = [] } = useShifts();
  const { data: employers = [] } = useEmployers();
  const [rangePreset, setRangePreset] = useState<ShiftRangePreset>('all');
  const [rangeAnchor, setRangeAnchor] = useState(new Date());
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  const [employerFilter, setEmployerFilter] = useState('all');
  const [employerMenuOpen, setEmployerMenuOpen] = useState(false);

  const employerMap = Object.fromEntries(employers.map((e) => [e.id, e]));

  const workedShifts = useMemo(() => {
    const worked = shifts.filter((shift) => shift.status === 'worked');
    const range = resolveShiftRange(rangePreset, rangeAnchor, customStart, customEnd);
    const inRange = range ? filterShiftsInRange(worked, range) : worked;
    if (employerFilter === 'all') return inRange;
    return inRange.filter((shift) => shift.employerId === employerFilter);
  }, [shifts, rangePreset, rangeAnchor, customStart, customEnd, employerFilter]);

  const totalHours = workedShifts.reduce((sum, shift) => sum + shift.durationMinutes / 60, 0);

  const employerFilterLabel =
    employerFilter === 'all'
      ? 'All employers'
      : (employerMap[employerFilter]?.name ?? 'Employer');

  return (
    <ScreenContainer title="Analytics">
      <ScrollView contentContainerStyle={styles.content}>
        <Card mode="elevated" style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Total Hours Worked
              </Text>
              <Menu
                visible={employerMenuOpen}
                onDismiss={() => setEmployerMenuOpen(false)}
                anchor={
                  <Button
                    mode="outlined"
                    compact
                    icon="chevron-down"
                    onPress={() => setEmployerMenuOpen(true)}
                  >
                    {employerFilterLabel}
                  </Button>
                }
              >
                <Menu.Item
                  title="All employers"
                  onPress={() => {
                    setEmployerFilter('all');
                    setEmployerMenuOpen(false);
                  }}
                />
                {employers.map((employer) => (
                  <Menu.Item
                    key={employer.id}
                    title={employer.name}
                    onPress={() => {
                      setEmployerFilter(employer.id);
                      setEmployerMenuOpen(false);
                    }}
                  />
                ))}
              </Menu>
            </View>

            <ShiftRangeFilter
              preset={rangePreset}
              anchor={rangeAnchor}
              customStart={customStart}
              customEnd={customEnd}
              onPresetChange={setRangePreset}
              onAnchorChange={setRangeAnchor}
              onCustomStartChange={setCustomStart}
              onCustomEndChange={setCustomEnd}
            />

            <Text variant="displaySmall" style={{ color: theme.colors.primary }}>
              {formatHours(totalHours)}h
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {workedShifts.length} worked shift{workedShifts.length === 1 ? '' : 's'} in this
              period
            </Text>
          </Card.Content>
        </Card>

        <RosterImpactPlanner />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl, gap: spacing.sm },
  card: { marginBottom: spacing.sm },
  cardContent: { gap: spacing.sm },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: { fontWeight: '600' },
});
