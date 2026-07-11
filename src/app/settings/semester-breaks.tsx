import { format } from 'date-fns';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, IconButton, List, Portal, Text, TextInput } from 'react-native-paper';
import { useQueryClient } from '@tanstack/react-query';

import { DateField } from '@/components/DateField';
import { EmptyState, ScreenContainer } from '@/components';
import { QUERY_KEYS } from '@/constants';
import { semesterBreakService } from '@/features/settings/services/semesterBreakService';
import { useSemesterBreaks } from '@/hooks/useCompliance';
import { useUserId } from '@/hooks/useUser';
import type { SemesterBreak } from '@/types';

export default function SemesterBreaksScreen() {
  const userId = useUserId()!;
  const { data: breaks = [], refetch } = useSemesterBreaks();
  const queryClient = useQueryClient();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editing, setEditing] = useState<SemesterBreak | null>(null);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.semesterBreaks });
    void refetch();
  };

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setStartDate(new Date());
    setEndDate(new Date());
    setError(null);
    setDialogVisible(true);
  };

  const openEdit = (breakItem: SemesterBreak) => {
    setEditing(breakItem);
    setTitle(breakItem.title);
    setStartDate(breakItem.startDate);
    setEndDate(breakItem.endDate);
    setError(null);
    setDialogVisible(true);
  };

  const handleSave = () => {
    try {
      if (editing) {
        semesterBreakService.update(editing, { title, startDate, endDate });
      } else {
        semesterBreakService.create(userId, { title, startDate, endDate });
      }
      setDialogVisible(false);
      invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save break.');
    }
  };

  const handleDelete = (breakItem: SemesterBreak) => {
    semesterBreakService.delete(breakItem.id, breakItem.userId);
    invalidate();
  };

  return (
    <ScreenContainer>
      <Text variant="bodyMedium" style={styles.intro}>
        Work limits do not apply during semester breaks. Add your university break periods so
        compliance calculations treat them correctly.
      </Text>

      {breaks.length === 0 ? (
        <EmptyState
          title="No semester breaks"
          message="Add your first break period to reflect unlimited work hours during holidays."
        />
      ) : (
        <ScrollView>
          {breaks.map((breakItem) => (
            <List.Item
              key={breakItem.id}
              title={breakItem.title}
              description={`${format(breakItem.startDate, 'd MMM yyyy')} — ${format(breakItem.endDate, 'd MMM yyyy')}`}
              right={() => (
                <View style={styles.actions}>
                  <IconButton icon="pencil" onPress={() => openEdit(breakItem)} />
                  <IconButton icon="delete" onPress={() => handleDelete(breakItem)} />
                </View>
              )}
            />
          ))}
        </ScrollView>
      )}

      <Button mode="contained" onPress={openCreate} style={styles.addBtn}>
        Add Semester Break
      </Button>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editing ? 'Edit Break' : 'Add Break'}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScroll}>
            <ScrollView>
              <TextInput label="Title" value={title} onChangeText={setTitle} style={styles.field} />
              <DateField label="Start date" value={startDate} onChange={setStartDate} />
              <DateField
                label="End date"
                value={endDate}
                onChange={setEndDate}
                minimumDate={startDate}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSave}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { opacity: 0.85, marginBottom: 16, lineHeight: 22 },
  addBtn: { marginTop: 16 },
  actions: { flexDirection: 'row' },
  dialogScroll: { maxHeight: 360, paddingHorizontal: 8 },
  field: { marginVertical: 8 },
  error: { color: '#D32F2F', marginTop: 8 },
});
