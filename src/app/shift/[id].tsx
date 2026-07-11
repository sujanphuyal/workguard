import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import { ShiftForm, type ShiftFormData } from '@/features/shifts/components/ShiftForm';
import { shiftService } from '@/features/shifts/services/shiftService';
import { useEmployers, useShifts, useUserContext } from '@/hooks/useCompliance';

export default function ShiftDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const context = useUserContext();
  const { data: shifts = [], refetch } = useShifts();
  const { data: employers = [], refetch: refetchEmployers } = useEmployers();
  const shift = shifts.find((s) => s.id === id);

  useFocusEffect(
    useCallback(() => {
      void refetchEmployers();
    }, [refetchEmployers]),
  );

  if (!shift || !context) {
    return <Text style={styles.container}>Shift not found</Text>;
  }

  const handleSave = (data: ShiftFormData) => {
    try {
      shiftService.update(shift, data, shifts, context);
      refetch();
      router.back();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update shift');
    }
  };

  const handleDelete = () => {
    shiftService.delete(shift.id, shift.userId);
    refetch();
    router.back();
  };

  const handleDuplicate = () => {
    try {
      shiftService.duplicate(shift, shifts, context);
      refetch();
      router.back();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to duplicate shift');
    }
  };

  return (
    <View style={styles.wrapper}>
      <ShiftForm
        employers={employers}
        initialShift={shift}
        submitLabel="Save Changes"
        onSubmit={handleSave}
      />
      <View style={styles.actions}>
        <Button mode="outlined" onPress={handleDuplicate} style={styles.btn}>
          Duplicate
        </Button>
        <Button mode="contained-tonal" textColor={theme.colors.error} onPress={handleDelete} style={styles.btn}>
          Delete
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { padding: 16 },
  actions: { paddingHorizontal: 16, paddingBottom: 24 },
  btn: { marginTop: 4 },
});
