import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  IconButton,
  List,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import { useQueryClient } from '@tanstack/react-query';

import { EmptyState, ScreenContainer } from '@/components';
import { EMPLOYER_COLOURS, QUERY_KEYS } from '@/constants';
import { employerService } from '@/features/shifts/services/employerService';
import { useEmployers } from '@/hooks/useCompliance';
import { useUserId } from '@/hooks/useUser';
import type { Employer } from '@/types';

export default function EmployersScreen() {
  const userId = useUserId()!;
  const { data: employers = [], refetch } = useEmployers();
  const queryClient = useQueryClient();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editing, setEditing] = useState<Employer | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [position, setPosition] = useState('');
  const [colour, setColour] = useState(EMPLOYER_COLOURS[0]!);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employers });
    void refetch();
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setLocation('');
    setPosition('');
    setColour(EMPLOYER_COLOURS[employers.length % EMPLOYER_COLOURS.length]!);
    setError(null);
    setDialogVisible(true);
  };

  const openEdit = (employer: Employer) => {
    setEditing(employer);
    setName(employer.name);
    setLocation(employer.location ?? '');
    setPosition(employer.position ?? '');
    setColour(employer.colour);
    setError(null);
    setDialogVisible(true);
  };

  const handleSave = () => {
    try {
      const input = { name, location, position, colour };
      if (editing) {
        employerService.update(editing, input);
      } else {
        employerService.create(userId, input);
      }
      setDialogVisible(false);
      invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save employer.');
    }
  };

  const handleDelete = (employer: Employer) => {
    try {
      employerService.delete(employer.id, employer.userId);
      invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete employer.');
      setDialogVisible(true);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="bodyMedium" style={styles.intro}>
          Add each workplace separately. When logging or scheduling a shift, pick the employer it
          belongs to.
        </Text>

        {employers.length === 0 ? (
          <EmptyState
            title="No employers yet"
            message="Add your first employer to start tracking shifts."
          />
        ) : (
          employers.map((employer) => (
            <List.Item
              key={employer.id}
              title={employer.name}
              description={[employer.position, employer.location].filter(Boolean).join(' · ') || undefined}
              left={() => <View style={[styles.dot, { backgroundColor: employer.colour }]} />}
              right={() => (
                <View style={styles.actions}>
                  <IconButton icon="pencil" onPress={() => openEdit(employer)} />
                  <IconButton icon="delete" onPress={() => handleDelete(employer)} />
                </View>
              )}
            />
          ))
        )}

        <Button mode="contained" onPress={openCreate} style={styles.addBtn}>
          Add Employer
        </Button>
      </ScrollView>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editing ? 'Edit Employer' : 'Add Employer'}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScroll}>
            <ScrollView>
              <TextInput label="Name" value={name} onChangeText={setName} style={styles.field} />
              <TextInput
                label="Position (optional)"
                value={position}
                onChangeText={setPosition}
                style={styles.field}
              />
              <TextInput
                label="Location (optional)"
                value={location}
                onChangeText={setLocation}
                style={styles.field}
              />
              <Text variant="labelMedium" style={styles.colourLabel}>
                Colour
              </Text>
              <View style={styles.colours}>
                {EMPLOYER_COLOURS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColour(c)}
                    style={[
                      styles.colourSwatch,
                      { backgroundColor: c },
                      colour === c && styles.colourSelected,
                    ]}
                  />
                ))}
              </View>
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
  scrollContent: { paddingBottom: 16 },
  intro: { opacity: 0.85, marginBottom: 16, lineHeight: 22 },
  dot: { width: 12, height: 12, borderRadius: 6, alignSelf: 'center', marginLeft: 16 },
  addBtn: { marginTop: 16 },
  actions: { flexDirection: 'row' },
  dialogScroll: { maxHeight: 400, paddingHorizontal: 8 },
  field: { marginVertical: 8 },
  colourLabel: { marginTop: 8 },
  colours: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  colourSwatch: { width: 32, height: 32, borderRadius: 16 },
  colourSelected: { borderWidth: 3, borderColor: '#000' },
  error: { color: '#D32F2F', marginTop: 8 },
});
