import { addMonths } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Menu, Text, TextInput, useTheme } from 'react-native-paper';

import { DateField } from '@/components';
import {
  getValidReminderOptions,
  getReminderLabel,
  type ReminderOption,
} from '@/features/shifts/services/reminderOptions';
import {
  getRepeatLabel,
  REPEAT_OPTIONS,
} from '@/features/shifts/services/repeatOptions';
import type { AppTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import type { RecurrenceConfig, RecurrenceFrequency } from '@/types';

export interface RepeatReminderValue {
  frequency: RecurrenceFrequency;
  customIntervalDays: number;
  endDate: Date;
  reminderMinutes: number | null;
}

interface ShiftRepeatReminderFieldsProps {
  shiftStart: Date;
  value: RepeatReminderValue;
  onChange: (value: RepeatReminderValue) => void;
  /** When editing an existing shift, hide series creation controls. */
  showRepeat: boolean;
}

export function buildDefaultRepeatReminder(shiftStart?: Date): RepeatReminderValue {
  const start = shiftStart ?? new Date();
  return {
    frequency: 'none',
    customIntervalDays: 1,
    endDate: addMonths(start, 3),
    reminderMinutes: null,
  };
}

export function toRecurrenceConfig(value: RepeatReminderValue): RecurrenceConfig | null {
  if (value.frequency === 'none') return null;
  return {
    frequency: value.frequency,
    interval: value.frequency === 'custom' ? Math.max(1, value.customIntervalDays) : 1,
    endDate: value.endDate,
  };
}

export function ShiftRepeatReminderFields({
  shiftStart,
  value,
  onChange,
  showRepeat,
}: ShiftRepeatReminderFieldsProps) {
  const theme = useTheme<AppTheme>();
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);

  const shiftStartMs = shiftStart.getTime();

  const validReminders = useMemo(
    () => getValidReminderOptions(new Date(shiftStartMs)),
    [shiftStartMs],
  );

  useEffect(() => {
    if (!validReminders.some((option) => option.minutes === value.reminderMinutes)) {
      onChange({ ...value, reminderMinutes: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftStartMs]);

  useEffect(() => {
    if (value.endDate.getTime() < shiftStartMs) {
      onChange({ ...value, endDate: addMonths(new Date(shiftStartMs), 3) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftStartMs]);

  const patch = (partial: Partial<RepeatReminderValue>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <View style={styles.wrap}>
      {showRepeat ? (
        <>
          <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Repeat
          </Text>
          <Menu
            visible={repeatOpen}
            onDismiss={() => setRepeatOpen(false)}
            anchor={
              <Button
                mode="outlined"
                icon="repeat"
                onPress={() => setRepeatOpen(true)}
                style={styles.field}
                contentStyle={styles.menuButton}
              >
                {getRepeatLabel(value.frequency)}
              </Button>
            }
          >
            {REPEAT_OPTIONS.map((option) => (
              <Menu.Item
                key={option.value}
                title={option.label}
                onPress={() => {
                  patch({ frequency: option.value });
                  setRepeatOpen(false);
                }}
              />
            ))}
          </Menu>

          {value.frequency === 'custom' ? (
            <TextInput
              label="Repeat every (days)"
              value={String(value.customIntervalDays)}
              onChangeText={(text) => {
                const parsed = parseInt(text.replace(/\D/g, ''), 10);
                patch({ customIntervalDays: Number.isNaN(parsed) ? 1 : Math.max(1, parsed) });
              }}
              keyboardType="number-pad"
              mode="outlined"
              style={styles.field}
            />
          ) : null}

          {value.frequency !== 'none' ? (
            <DateField
              label="Repeat until"
              value={value.endDate}
              onChange={(date) => patch({ endDate: date })}
              minimumDate={shiftStart}
            />
          ) : null}
        </>
      ) : null}

      <Text
        variant="titleSmall"
        style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.sm }}
      >
        Reminder
      </Text>
      <Menu
        visible={reminderOpen}
        onDismiss={() => setReminderOpen(false)}
        anchor={
          <Button
            mode="outlined"
            icon="bell-outline"
            onPress={() => setReminderOpen(true)}
            style={styles.field}
            contentStyle={styles.menuButton}
          >
            {getReminderLabel(value.reminderMinutes)}
          </Button>
        }
      >
        {validReminders.map((option: ReminderOption) => (
          <Menu.Item
            key={String(option.minutes)}
            title={option.label}
            onPress={() => {
              patch({ reminderMinutes: option.minutes });
              setReminderOpen(false);
              if (option.minutes != null) {
                void import('@/features/notifications/services/notificationService').then((mod) =>
                  mod.requestNotificationPermissions(),
                );
              }
            }}
          />
        ))}
      </Menu>
      {validReminders.length <= 1 ? (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          This shift is too soon for advance reminders.
        </Text>
      ) : (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Only options that can fire before this shift are shown. Notifications must be allowed.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, marginBottom: spacing.sm },
  field: { marginVertical: spacing.xs },
  menuButton: { justifyContent: 'flex-start' },
});
