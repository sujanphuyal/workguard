import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { ShiftForm, type ShiftFormData } from '@/features/shifts/components/ShiftForm';
import { shiftService } from '@/features/shifts/services/shiftService';
import { useEmployers, useShifts, useUserContext } from '@/hooks/useCompliance';
import { useUserId } from '@/hooks/useUser';

export default function NewShiftScreen() {
  const theme = useTheme();
  const userId = useUserId()!;
  const context = useUserContext();
  const { data: employers = [], refetch: refetchEmployers } = useEmployers();
  const { data: shifts = [], refetch } = useShifts();

  useFocusEffect(
    useCallback(() => {
      void refetchEmployers();
    }, [refetchEmployers]),
  );

  if (!context) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onBackground }}>Loading...</Text>
      </View>
    );
  }

  const onSubmit = (data: ShiftFormData) => {
    try {
      const { recurrence, ...input } = data;
      shiftService.createWithRepeat(userId, input, recurrence ?? null, shifts, context);
      refetch();
      router.back();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save shift');
    }
  };

  return (
    <ShiftForm
      employers={employers}
      submitLabel="Save Shift"
      onSubmit={onSubmit}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, padding: 16, justifyContent: 'center' },
});
