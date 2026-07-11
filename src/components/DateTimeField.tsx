import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Platform, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import type { AppTheme } from '@/theme';
import { hairline, radius } from '@/theme/tokens';

interface DateTimeFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
}

function openAndroidDateTimePicker(
  current: Date,
  onSelect: (date: Date) => void,
  minimumDate?: Date,
) {
  DateTimePickerAndroid.open({
    value: current,
    mode: 'date',
    minimumDate,
    onValueChange: (_event, pickedDate) => {
      DateTimePickerAndroid.open({
        value: pickedDate,
        mode: 'time',
        is24Hour: false,
        onValueChange: (_timeEvent, finalDate) => {
          onSelect(finalDate);
        },
      });
    },
  });
}

export function DateTimeField({ label, value, onChange, minimumDate }: DateTimeFieldProps) {
  const theme = useTheme<AppTheme>();
  const colorScheme = useColorScheme();
  const formatted = format(value, 'EEE d MMM yyyy, h:mm a');

  if (Platform.OS === 'android') {
    return (
      <View style={styles.field}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${formatted}. Tap to change.`}
          onPress={() => openAndroidDateTimePicker(value, onChange, minimumDate)}
          style={[
            styles.androidButton,
            {
              borderColor: theme.colors.outline,
              backgroundColor: theme.colors.surfaceVariant,
            },
          ]}
        >
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
            {formatted}
          </Text>
          <Text variant="labelSmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
            Tap to change
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={[styles.iosValue, { color: theme.colors.onSurface }]}>
        {formatted}
      </Text>
      <DateTimePicker
        value={value}
        mode="datetime"
        display="spinner"
        minimumDate={minimumDate}
        themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
        onChange={(_event, date) => date && onChange(date)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginVertical: 8 },
  androidButton: {
    marginTop: 6,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: hairline,
  },
  hint: { marginTop: 4 },
  iosValue: { marginVertical: 4 },
});
