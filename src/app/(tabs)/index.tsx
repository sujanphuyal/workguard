import { router } from 'expo-router';
import { isSameDay, format } from 'date-fns';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Menu, Text } from 'react-native-paper';

import {
  ComplianceIndicator,
  EmptyState,
  ScreenContainer,
  ShiftCard,
  ShowMoreButton,
} from '@/components';
import { useCompliance, useEmployers, useRuleProfile, useShifts, useUserContext, useViolatingShiftIds } from '@/hooks/useCompliance';
import { useIncrementalReveal } from '@/hooks/useIncrementalReveal';
import { findEarliestAvailableStart } from '@/rules/VisaRuleEngine';
import { sortShiftsByStart } from '@/utils/shifts';

export default function DashboardScreen() {
  const context = useUserContext();
  const { data: shifts = [] } = useShifts();
  const { data: employers = [] } = useEmployers();
  const ruleProfile = useRuleProfile();
  const compliance = useCompliance();
  const violatingIds = useViolatingShiftIds();
  const [employerFilter, setEmployerFilter] = useState<string>('all');
  const [employerMenuOpen, setEmployerMenuOpen] = useState(false);

  const employerMap = Object.fromEntries(employers.map((e) => [e.id, e]));

  const upcoming = useMemo(() => {
    const now = new Date();
    const sorted = sortShiftsByStart(
      shifts.filter((s) => s.status === 'scheduled' && s.startTime > now),
    );
    if (employerFilter === 'all') return sorted;
    return sorted.filter((s) => s.employerId === employerFilter);
  }, [shifts, employerFilter]);

  const {
    visibleItems: visibleUpcoming,
    remaining,
    hasMore,
    canShowLess,
    showMore,
    showLess,
  } = useIncrementalReveal(upcoming, `${employerFilter}-${upcoming.length}`);

  const employerFilterLabel =
    employerFilter === 'all'
      ? 'All employers'
      : (employerMap[employerFilter]?.name ?? 'Employer');

  const earliestShiftStart =
    context && !compliance?.isUnlimited
      ? findEarliestAvailableStart(shifts, 60, context, ruleProfile, new Date())
      : null;

  const showEarliestShiftStart =
    earliestShiftStart &&
    compliance &&
    (compliance.status === 'violation' || compliance.remainingHours < 1) &&
    !isSameDay(earliestShiftStart, new Date());

  if (!compliance) {
    return (
      <ScreenContainer title="Dashboard">
        <EmptyState title="Loading compliance data..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Dashboard">
      <ScrollView>
        <ComplianceIndicator
          status={compliance.status}
          currentHours={compliance.projectedHours}
          maxHours={compliance.maxHours}
          remainingHours={compliance.remainingHours}
          isUnlimited={compliance.isUnlimited}
          compliance={compliance}
        />
        {showEarliestShiftStart && (
          <Text variant="bodyMedium" style={styles.hint}>
            Earliest shift start without breaching your limit:{' '}
            {format(earliestShiftStart!, 'EEE d MMM yyyy')}
          </Text>
        )}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Upcoming Scheduled
          </Text>
          <Menu
            visible={employerMenuOpen}
            onDismiss={() => setEmployerMenuOpen(false)}
            anchor={
              <Button
                mode="outlined"
                compact
                icon="filter-variant"
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
        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming shifts" />
        ) : (
          <>
            {visibleUpcoming.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                employer={employerMap[shift.employerId]}
                violatesLimit={violatingIds.has(shift.id)}
                onPress={() => router.push(`/shift/${shift.id}`)}
              />
            ))}
            {hasMore || canShowLess ? (
              <ShowMoreButton
                remaining={remaining}
                hasMore={hasMore}
                canShowLess={canShowLess}
                onShowMore={showMore}
                onShowLess={showLess}
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: { fontWeight: '600', flex: 1 },
  hint: { marginTop: 8, marginBottom: 4, opacity: 0.85, paddingHorizontal: 4 },
});
