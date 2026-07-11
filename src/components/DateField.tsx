import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

interface DateFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
}

function openAndroidDatePicker(
  current: Date,
  onSelect: (date: Date) => void,
  minimumDate?: Date,
) {
  DateTimePickerAndroid.open({
    value: current,
    mode: 'date',
    minimumDate,
    onValueChange: (_event, pickedDate) => {
      onSelect(pickedDate);
    },
  });
}

export function DateField({ label, value, onChange, minimumDate }: DateFieldProps) {
  const formatted = format(value, 'EEE d MMM yyyy');

  if (Platform.OS === 'android') {
    return (
      <View style={styles.field}>
        <Text variant="labelMedium">{label}</Text>
        <Pressable onPress={() => openAndroidDatePicker(value, onChange, minimumDate)}>
          <Text variant="bodyLarge" style={styles.value}>
            {formatted}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text variant="labelMedium">{label}</Text>
      <DateTimePicker
        value={value}
        mode="date"
        display="spinner"
        minimumDate={minimumDate}
        onChange={(_event, date) => {
          if (date) onChange(date);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginVertical: 8 },
  value: { paddingVertical: 8 },
});
