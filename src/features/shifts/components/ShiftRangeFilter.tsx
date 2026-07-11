import { addMonths, addWeeks, format, subMonths, subWeeks } from 'date-fns';
import { StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text } from 'react-native-paper';

import { DateField } from '@/components';
import { getMonthRange, getWeekRange, type ShiftRangePreset } from '@/utils/shiftFilters';
import { spacing } from '@/theme/tokens';

interface ShiftRangeFilterProps {
  preset: ShiftRangePreset;
  anchor: Date;
  customStart: Date;
  customEnd: Date;
  onPresetChange: (preset: ShiftRangePreset) => void;
  onAnchorChange: (anchor: Date) => void;
  onCustomStartChange: (date: Date) => void;
  onCustomEndChange: (date: Date) => void;
}

export function ShiftRangeFilter({
  preset,
  anchor,
  customStart,
  customEnd,
  onPresetChange,
  onAnchorChange,
  onCustomStartChange,
  onCustomEndChange,
}: ShiftRangeFilterProps) {
  const showPeriodNav = preset === 'week' || preset === 'month';

  const periodLabel =
    preset === 'week'
      ? (() => {
          const { start, end } = getWeekRange(anchor);
          return `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`;
        })()
      : format(getMonthRange(anchor).start, 'MMMM yyyy');

  const handlePrevious = () => {
    onAnchorChange(preset === 'week' ? subWeeks(anchor, 1) : subMonths(anchor, 1));
  };

  const handleNext = () => {
    onAnchorChange(preset === 'week' ? addWeeks(anchor, 1) : addMonths(anchor, 1));
  };

  return (
    <View style={styles.wrap}>
      <SegmentedButtons
        value={preset}
        onValueChange={(value) => onPresetChange(value as ShiftRangePreset)}
        buttons={[
          { value: 'all', label: 'All' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'custom', label: 'Range' },
        ]}
      />

      {showPeriodNav ? (
        <View style={styles.periodNav}>
          <Button mode="outlined" compact onPress={handlePrevious}>
            Previous
          </Button>
          <Text variant="bodyMedium" style={styles.periodLabel}>
            {periodLabel}
          </Text>
          <Button mode="outlined" compact onPress={handleNext}>
            Next
          </Button>
        </View>
      ) : null}

      {preset === 'custom' ? (
        <View style={styles.customRange}>
          <View style={styles.dateField}>
            <DateField label="From" value={customStart} onChange={onCustomStartChange} />
          </View>
          <View style={styles.dateField}>
            <DateField label="To" value={customEnd} onChange={onCustomEndChange} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.sm },
  periodNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  periodLabel: { flex: 1, textAlign: 'center', fontWeight: '600' },
  customRange: { flexDirection: 'row', gap: spacing.sm },
  dateField: { flex: 1 },
});
