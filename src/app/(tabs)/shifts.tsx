import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { FAB, Searchbar } from 'react-native-paper';

import { EmptyState, ScreenContainer, ShiftCard, ShowMoreButton } from '@/components';
import { ShiftRangeFilter } from '@/features/shifts/components/ShiftRangeFilter';
import { useEmployers, useShifts, useViolatingShiftIds } from '@/hooks/useCompliance';
import { useIncrementalReveal } from '@/hooks/useIncrementalReveal';
import {
  filterShiftsInRange,
  resolveShiftRange,
  type ShiftRangePreset,
} from '@/utils/shiftFilters';
import { sortShiftsNearestUpcomingFirst } from '@/utils/shifts';

export default function ShiftsScreen() {
  const { data: shifts = [], refetch } = useShifts();
  const { data: employers = [] } = useEmployers();
  const violatingIds = useViolatingShiftIds();
  const [query, setQuery] = useState('');
  const [rangePreset, setRangePreset] = useState<ShiftRangePreset>('all');
  const [rangeAnchor, setRangeAnchor] = useState(new Date());
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());

  const employerMap = Object.fromEntries(employers.map((e) => [e.id, e]));

  const filtered = useMemo(() => {
    const range = resolveShiftRange(rangePreset, rangeAnchor, customStart, customEnd);
    const inRange = range
      ? filterShiftsInRange(shifts, range)
      : sortShiftsNearestUpcomingFirst(shifts);

    if (!query) return inRange;
    const q = query.toLowerCase();
    return inRange.filter(
      (s) =>
        s.notes?.toLowerCase().includes(q) ||
        employerMap[s.employerId]?.name.toLowerCase().includes(q) ||
        s.status.includes(q),
    );
  }, [shifts, query, employerMap, rangePreset, rangeAnchor, customStart, customEnd]);

  const resetKey = `${rangePreset}-${rangeAnchor.toISOString()}-${customStart.toISOString()}-${customEnd.toISOString()}-${query}-${filtered.length}`;
  const { visibleItems, remaining, hasMore, canShowLess, showMore, showLess } =
    useIncrementalReveal(filtered, resetKey);

  const handlePresetChange = (preset: ShiftRangePreset) => {
    setRangePreset(preset);
  };

  return (
    <ScreenContainer title="Work Shifts">
      <ShiftRangeFilter
        preset={rangePreset}
        anchor={rangeAnchor}
        customStart={customStart}
        customEnd={customEnd}
        onPresetChange={handlePresetChange}
        onAnchorChange={setRangeAnchor}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
      />
      <Searchbar
        placeholder="Search shifts..."
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />
      {filtered.length === 0 ? (
        <EmptyState title="No shifts found" message="Add your first work shift to get started." />
      ) : (
        <View style={styles.list}>
          <FlatList
            data={visibleItems}
            onRefresh={refetch}
            refreshing={false}
            renderItem={({ item }) => (
              <ShiftCard
                shift={item}
                employer={employerMap[item.employerId]}
                violatesLimit={violatingIds.has(item.id)}
                onPress={() => router.push(`/shift/${item.id}`)}
              />
            )}
            keyExtractor={(item) => item.id}
            ListFooterComponent={
              hasMore || canShowLess ? (
                <ShowMoreButton
                  remaining={remaining}
                  hasMore={hasMore}
                  canShowLess={canShowLess}
                  onShowMore={showMore}
                  onShowLess={showLess}
                />
              ) : null
            }
          />
        </View>
      )}
      <FAB icon="plus" style={styles.fab} onPress={() => router.push('/shift/new')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  search: { marginBottom: 8 },
  list: { flex: 1 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
