import * as Crypto from 'expo-crypto';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  IconButton,
  List,
  Menu,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';

import { EmptyState, TimeField } from '@/components';
import {
  formatScheduleClock,
  getScheduleInitials,
  parseScheduleClock,
} from '@/features/settings/services/shiftSchedulePresets';
import { spacing } from '@/theme/tokens';
import type { Employer, ShiftSchedulePreset } from '@/types';

interface ShiftSchedulePresetsEditorProps {
  presets: ShiftSchedulePreset[];
  employers: Employer[];
  onChange: (presets: ShiftSchedulePreset[]) => void;
}

function defaultStartTime() {
  const date = new Date();
  date.setHours(6, 0, 0, 0);
  return date;
}

function defaultEndTime() {
  const date = new Date();
  date.setHours(14, 0, 0, 0);
  return date;
}

export function ShiftSchedulePresetsEditor({
  presets,
  employers,
  onChange,
}: ShiftSchedulePresetsEditorProps) {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState<ShiftSchedulePreset | null>(null);
  const [label, setLabel] = useState('');
  const [employerId, setEmployerId] = useState('');
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [error, setError] = useState<string | null>(null);

  const selectedEmployer = employers.find((employer) => employer.id === employerId);

  const employerName = (id: string) => employers.find((employer) => employer.id === id)?.name ?? 'Unknown';

  const openCreate = () => {
    setEditing(null);
    setLabel('');
    setEmployerId(employers[0]?.id ?? '');
    setStartTime(defaultStartTime());
    setEndTime(defaultEndTime());
    setError(null);
    setDialogVisible(true);
  };

  const openEdit = (preset: ShiftSchedulePreset) => {
    setEditing(preset);
    setLabel(preset.label);
    setEmployerId(preset.employerId);
    setStartTime(parseScheduleClock(preset.startTime));
    setEndTime(parseScheduleClock(preset.endTime));
    setError(null);
    setDialogVisible(true);
  };

  const handleSave = () => {
    const trimmed = label.trim();
    if (!trimmed) {
      setError('Enter a label.');
      return;
    }
    if (!employerId) {
      setError('Select an employer.');
      return;
    }

    const nextPreset: ShiftSchedulePreset = {
      id: editing?.id ?? Crypto.randomUUID(),
      employerId,
      label: trimmed,
      startTime: formatScheduleClock(startTime),
      endTime: formatScheduleClock(endTime),
    };

    if (editing) {
      onChange(presets.map((preset) => (preset.id === editing.id ? nextPreset : preset)));
    } else {
      onChange([...presets, nextPreset]);
    }

    setDialogVisible(false);
    setError(null);
  };

  const handleDelete = (id: string) => {
    onChange(presets.filter((preset) => preset.id !== id));
  };

  if (employers.length === 0) {
    return (
      <EmptyState
        title="No employers yet"
        message="Add an employer before creating shift labels."
      />
    );
  }

  return (
    <View style={styles.wrap}>
      {presets.length === 0 ? (
        <EmptyState title="No shift labels yet" message="Add a label to use on the New Shift page." />
      ) : (
        presets.map((preset) => (
          <List.Item
            key={preset.id}
            title={`${getScheduleInitials(preset.label)} · ${preset.label}`}
            description={`${employerName(preset.employerId)} · ${preset.startTime} – ${preset.endTime}`}
            right={() => (
              <View style={styles.actions}>
                <IconButton icon="pencil" onPress={() => openEdit(preset)} />
                <IconButton icon="delete" onPress={() => handleDelete(preset.id)} />
              </View>
            )}
          />
        ))
      )}

      <Button mode="contained" icon="plus" onPress={openCreate} style={styles.addBtn}>
        Add shift label
      </Button>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editing ? 'Edit shift label' : 'Add shift label'}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScroll}>
            <ScrollView>
              <Menu
                visible={menuOpen}
                onDismiss={() => setMenuOpen(false)}
                anchor={
                  <Button mode="outlined" onPress={() => setMenuOpen(true)} style={styles.field}>
                    {selectedEmployer?.name ?? 'Select employer'}
                  </Button>
                }
              >
                {employers.map((employer) => (
                  <Menu.Item
                    key={employer.id}
                    title={employer.name}
                    onPress={() => {
                      setEmployerId(employer.id);
                      setMenuOpen(false);
                    }}
                  />
                ))}
              </Menu>

              <TextInput
                label="Label"
                value={label}
                onChangeText={setLabel}
                mode="outlined"
                style={styles.field}
              />

              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <TimeField label="Start time" value={startTime} onChange={setStartTime} />
                </View>
                <View style={styles.timeField}>
                  <TimeField label="End time" value={endTime} onChange={setEndTime} />
                </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  actions: { flexDirection: 'row' },
  addBtn: { marginTop: spacing.sm },
  dialogScroll: { maxHeight: 420, paddingHorizontal: 8 },
  field: { marginVertical: spacing.xs },
  timeRow: { flexDirection: 'row', gap: spacing.md },
  timeField: { flex: 1 },
  error: { color: '#D32F2F', marginTop: spacing.xs },
});
