import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Platform, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import type { AppTheme } from '@/theme';
import { hairline, radius } from '@/theme/tokens';

interface TimeFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}

function openAndroidTimePicker(current: Date, onSelect: (date: Date) => void) {
  DateTimePickerAndroid.open({
    value: current,
    mode: 'time',
    is24Hour: false,
    onValueChange: (_event, pickedTime) => {
      onSelect(pickedTime);
    },
  });
}

export function TimeField({ label, value, onChange }: TimeFieldProps) {
  const theme = useTheme<AppTheme>();
  const colorScheme = useColorScheme();
  const formatted = format(value, 'h:mm a');

  if (Platform.OS === 'android') {
    return (
      <View style={styles.field}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${formatted}. Tap to change.`}
          onPress={() => openAndroidTimePicker(value, onChange)}
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
        mode="time"
        display="spinner"
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
  iosValue: { marginVertical: 4 },
});
