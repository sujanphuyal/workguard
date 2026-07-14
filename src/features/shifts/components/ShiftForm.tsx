import { zodResolver } from '@hookform/resolvers/zod';

import { router } from 'expo-router';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { StyleSheet, View } from 'react-native';

import { Button, Card, Divider, Menu, Text, TextInput, useTheme } from 'react-native-paper';

import { z } from 'zod';



import { InlineCalendarField, KeyboardAwareScrollView, TimeField } from '@/components';

import { DEFAULT_BREAK_MINUTES } from '@/constants';

import {
  ShiftSchedulePresetPicker,
  applyShiftSchedulePreset,
} from '@/features/shifts/components/ShiftSchedulePresetPicker';
import {
  ShiftRepeatReminderFields,
  buildDefaultRepeatReminder,
  toRecurrenceConfig,
  type RepeatReminderValue,
} from '@/features/shifts/components/ShiftRepeatReminderFields';
import { filterShiftSchedulesForEmployer } from '@/features/settings/services/shiftSchedulePresets';

import type { AppTheme } from '@/theme';

import { spacing } from '@/theme/tokens';

import type {
  Employer,
  RecurrenceConfig,
  Shift,
  ShiftSchedulePreset,
  ShiftStatus,
} from '@/types';

import { useAuthStore } from '@/store';

import {

  combineDateAndTime,

  defaultShiftTimes,

  inferShiftStatus,

} from '@/utils/shifts';

import { calculateNetDurationMinutes, formatHours, minutesToHours } from '@/utils/time';



const schema = z.object({

  employerId: z.string().min(1, 'Select an employer'),

  shiftDate: z.date(),

  startTime: z.date(),

  endTime: z.date(),

  breakMinutes: z.coerce.number().min(0, 'Break cannot be negative'),

  notes: z.string().optional(),

});



type ShiftFormValues = z.infer<typeof schema>;



export type ShiftFormData = {

  employerId: string;

  status: ShiftStatus;

  startTime: Date;

  endTime: Date;

  breakMinutes: number;

  notes?: string;

  reminderMinutes?: number | null;

  recurrence?: RecurrenceConfig | null;

};



interface ShiftFormProps {

  employers: Employer[];

  initialShift?: Shift;

  submitLabel: string;

  onSubmit: (data: ShiftFormData) => void;

}



function buildDefaults(initialShift?: Shift): ShiftFormValues {

  if (initialShift) {

    return {

      employerId: initialShift.employerId,

      shiftDate: new Date(initialShift.startTime),

      startTime: new Date(initialShift.startTime),

      endTime: new Date(initialShift.endTime),

      breakMinutes: initialShift.breakMinutes ?? DEFAULT_BREAK_MINUTES,

      notes: initialShift.notes ?? '',

    };

  }



  const { start, end } = defaultShiftTimes();

  return {

    employerId: '',

    shiftDate: new Date(),

    startTime: start,

    endTime: end,

    breakMinutes: DEFAULT_BREAK_MINUTES,

    notes: '',

  };

}



function resolveShiftDateTimes(values: ShiftFormValues) {

  let startTime = combineDateAndTime(values.shiftDate, values.startTime);

  let endTime = combineDateAndTime(values.shiftDate, values.endTime);

  if (endTime <= startTime) {

    endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);

  }

  const status = inferShiftStatus(startTime);

  return { startTime, endTime, status };

}



export function ShiftForm({ employers, initialShift, submitLabel, onSubmit }: ShiftFormProps) {

  const theme = useTheme<AppTheme>();

  const shiftSchedules = useAuthStore((s) => s.settings?.shiftSchedules ?? []);

  const [menuOpen, setMenuOpen] = useState(false);

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const applyingPresetRef = useRef(false);

  const [repeatReminder, setRepeatReminder] = useState<RepeatReminderValue>(() =>
    buildDefaultRepeatReminder(initialShift?.startTime),
  );



  const {

    control,

    handleSubmit,

    setValue,

    watch,

    reset,

    formState: { errors },

  } = useForm<ShiftFormValues>({

    resolver: zodResolver(schema),

    defaultValues: buildDefaults(initialShift),

  });



  useEffect(() => {

    if (initialShift) {

      reset(buildDefaults(initialShift));

      setRepeatReminder({
        ...buildDefaultRepeatReminder(initialShift.startTime),
        reminderMinutes: initialShift.reminderMinutes ?? null,
      });

    }

  }, [initialShift, reset]);



  const employerId = watch('employerId');

  const shiftDate = watch('shiftDate');

  const startTimeOnly = watch('startTime');

  const endTimeOnly = watch('endTime');

  const breakMinutes = watch('breakMinutes');

  const selectedEmployer = employers.find((e) => e.id === employerId);

  const employerShiftLabels = useMemo(
    () => filterShiftSchedulesForEmployer(shiftSchedules, employerId),
    [shiftSchedules, employerId],
  );



  const { startTime, endTime } = useMemo(

    () =>

      resolveShiftDateTimes({

        employerId,

        shiftDate,

        startTime: startTimeOnly,

        endTime: endTimeOnly,

        breakMinutes,

        notes: '',

      }),

    [employerId, shiftDate, startTimeOnly, endTimeOnly, breakMinutes],

  );



  const workedPreview = useMemo(() => {

    const net = calculateNetDurationMinutes(startTime, endTime, breakMinutes ?? 0);

    return formatHours(minutesToHours(Math.max(0, net)));

  }, [startTime, endTime, breakMinutes]);



  useEffect(() => {

    if (!employerId && employers[0]) {

      setValue('employerId', employers[0].id);

    }

  }, [employers, employerId, setValue]);



  useEffect(() => {

    if (selectedPresetId && !employerShiftLabels.some((preset) => preset.id === selectedPresetId)) {

      setSelectedPresetId(null);

    }

  }, [employerShiftLabels, selectedPresetId]);



  const handleSelectPreset = (preset: ShiftSchedulePreset | null) => {

    if (!preset) {

      setSelectedPresetId(null);

      return;

    }



    applyingPresetRef.current = true;

    const applied = applyShiftSchedulePreset(preset);

    setValue('startTime', applied.startTime);

    setValue('endTime', applied.endTime);

    setSelectedPresetId(preset.id);

    applyingPresetRef.current = false;

  };



  const clearPresetIfManualEdit = () => {

    if (!applyingPresetRef.current) {

      setSelectedPresetId(null);

    }

  };



  const handleFormSubmit = (values: ShiftFormValues) => {

    const resolved = resolveShiftDateTimes(values);

    onSubmit({

      employerId: values.employerId,

      status: resolved.status,

      startTime: resolved.startTime,

      endTime: resolved.endTime,

      breakMinutes: values.breakMinutes ?? DEFAULT_BREAK_MINUTES,

      notes: values.notes,

      reminderMinutes: repeatReminder.reminderMinutes,

      recurrence: toRecurrenceConfig(repeatReminder),

    });

  };



  return (

    <KeyboardAwareScrollView

      includeHeaderOffset

      style={{ backgroundColor: theme.colors.background }}

      contentContainerStyle={styles.container}

    >

      <Card mode="elevated" style={styles.card}>

        <Card.Content>

          <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>

            Employer

          </Text>

          {employers.length === 0 ? (

            <View style={styles.noEmployer}>

              <Text variant="bodyMedium">Add an employer before saving a shift.</Text>

              <Button mode="contained" onPress={() => router.push('/settings/employers')}>

                Add Employer

              </Button>

            </View>

          ) : (

            <>

              <Menu

                visible={menuOpen}

                onDismiss={() => setMenuOpen(false)}

                anchor={

                  <Button mode="outlined" onPress={() => setMenuOpen(true)} style={styles.field}>

                    {selectedEmployer?.name ?? 'Select employer'}

                  </Button>

                }

              >

                {employers.map((e) => (

                  <Menu.Item

                    key={e.id}

                    title={e.name}

                    leadingIcon="circle"

                    onPress={() => {

                      setValue('employerId', e.id);

                      setSelectedPresetId(null);

                      setMenuOpen(false);

                    }}

                  />

                ))}

                <Menu.Item

                  title="Add employer..."

                  leadingIcon="plus"

                  onPress={() => {

                    setMenuOpen(false);

                    router.push('/settings/employers');

                  }}

                />

              </Menu>

              {errors.employerId ? (

                <Text style={[styles.error, { color: theme.colors.error }]}>

                  {errors.employerId.message}

                </Text>

              ) : null}

            </>

          )}



          <Divider style={styles.divider} />



          <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>

            Date & time

          </Text>



          <Controller

            control={control}

            name="shiftDate"

            render={({ field: { value, onChange } }) => (

              <InlineCalendarField label="Shift date" value={value} onChange={onChange} />

            )}

          />



          <ShiftSchedulePresetPicker

            presets={employerShiftLabels}

            selectedPresetId={selectedPresetId}

            onSelectPreset={handleSelectPreset}

          />



          <View style={styles.timeRow}>

            <View style={styles.timeField}>

              <Controller

                control={control}

                name="startTime"

                render={({ field: { value, onChange } }) => (

                  <TimeField

                    label="Start time"

                    value={value}

                    onChange={(date) => {

                      clearPresetIfManualEdit();

                      onChange(date);

                    }}

                  />

                )}

              />

            </View>

            <View style={styles.timeField}>

              <Controller

                control={control}

                name="endTime"

                render={({ field: { value, onChange } }) => (

                  <TimeField

                    label="End time"

                    value={value}

                    onChange={(date) => {

                      clearPresetIfManualEdit();

                      onChange(date);

                    }}

                  />

                )}

              />

            </View>

          </View>

          <Divider style={styles.divider} />



          <Controller

            control={control}

            name="breakMinutes"

            render={({ field: { value, onChange } }) => (

              <TextInput

                label="Break (minutes)"

                value={String(value ?? DEFAULT_BREAK_MINUTES)}

                onChangeText={(text) => {

                  clearPresetIfManualEdit();

                  const parsed = parseInt(text.replace(/\D/g, ''), 10);

                  onChange(Number.isNaN(parsed) ? 0 : parsed);

                }}

                keyboardType="number-pad"

                mode="outlined"

                style={styles.field}

                right={<TextInput.Affix text="min" />}

              />

            )}

          />

          {errors.breakMinutes ? (

            <Text style={[styles.error, { color: theme.colors.error }]}>

              {errors.breakMinutes.message}

            </Text>

          ) : null}

          <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.primary }]}>

            Worked hours: {workedPreview}h (break time is not counted)

          </Text>

          <Divider style={styles.divider} />

          <ShiftRepeatReminderFields
            shiftStart={startTime}
            value={repeatReminder}
            onChange={setRepeatReminder}
            showRepeat
          />



          <Controller

            control={control}

            name="notes"

            render={({ field: { value, onChange } }) => (

              <TextInput

                label="Notes"

                value={value}

                onChangeText={onChange}

                multiline

                mode="outlined"

                style={styles.field}

              />

            )}

          />

        </Card.Content>

      </Card>



      <Button

        mode="contained"

        onPress={handleSubmit(handleFormSubmit)}

        style={styles.submit}

        disabled={employers.length === 0}

      >

        {submitLabel}

      </Button>

    </KeyboardAwareScrollView>

  );

}



const styles = StyleSheet.create({

  container: { padding: spacing.md, paddingBottom: spacing.xxl },

  card: { marginBottom: spacing.md },

  field: { marginVertical: spacing.xs },

  divider: { marginVertical: spacing.md },

  error: { marginBottom: spacing.xs },

  hint: { marginBottom: spacing.sm },

  noEmployer: { gap: spacing.sm, marginVertical: spacing.sm },

  submit: { marginTop: spacing.xs },

  timeRow: {

    flexDirection: 'row',

    gap: spacing.md,

  },

  timeField: { flex: 1 },

});


