import { StyleSheet, View } from 'react-native';
import { Checkbox, Text, useTheme } from 'react-native-paper';

import {
  getScheduleInitials,
  parseScheduleClock,
} from '@/features/settings/services/shiftSchedulePresets';
import type { AppTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import type { ShiftSchedulePreset } from '@/types';

interface ShiftSchedulePresetPickerProps {
  presets: ShiftSchedulePreset[];
  selectedPresetId: string | null;
  onSelectPreset: (preset: ShiftSchedulePreset | null) => void;
}

export function ShiftSchedulePresetPicker({
  presets,
  selectedPresetId,
  onSelectPreset,
}: ShiftSchedulePresetPickerProps) {
  const theme = useTheme<AppTheme>();

  if (presets.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        Shift labels
      </Text>

      {presets.map((preset) => {
        const checked = selectedPresetId === preset.id;
        return (
          <Checkbox.Item
            key={preset.id}
            label={`${getScheduleInitials(preset.label)} · ${preset.label} (${preset.startTime}–${preset.endTime})`}
            status={checked ? 'checked' : 'unchecked'}
            onPress={() => {
              if (checked) {
                onSelectPreset(null);
                return;
              }
              onSelectPreset(preset);
            }}
            style={[
              styles.item,
              checked && {
                backgroundColor: theme.colors.primaryContainer,
                borderRadius: radius.sm,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export function applyShiftSchedulePreset(preset: ShiftSchedulePreset): {
  startTime: Date;
  endTime: Date;
} {
  return {
    startTime: parseScheduleClock(preset.startTime),
    endTime: parseScheduleClock(preset.endTime),
  };
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, marginBottom: spacing.sm },
  item: { paddingHorizontal: 0 },
});
