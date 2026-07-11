import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Menu, Text, TextInput, useTheme } from 'react-native-paper';

import { InlineCalendarField, TimeField } from '@/components';
import { DEFAULT_BREAK_MINUTES } from '@/constants';
import { defaultProspectiveFriday } from '@/features/analytics/utils/windowHeatmap';
import {
  useCompliance,
  useEmployers,
  useRuleProfile,
  useShifts,
  useUserContext,
} from '@/hooks/useCompliance';
import { useUserId } from '@/hooks/useUser';
import { simulateFutureShift, validateShift } from '@/rules/VisaRuleEngine';
import { getComplianceColor, type AppTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import type { Shift } from '@/types';
import { combineDateAndTime } from '@/utils/shifts';
import { addMinutes, formatHours, hoursToMinutes } from '@/utils/time';
import { useAuthStore } from '@/store';

function buildProspectiveShift(
  userId: string,
  employerId: string,
  shiftDate: Date,
  startTime: Date,
  netHours: number,
  breakMinutes: number,
): Shift {
  const start = combineDateAndTime(shiftDate, startTime);
  const durationMinutes = hoursToMinutes(netHours);
  const end = addMinutes(start, durationMinutes + breakMinutes);
  const now = new Date();

  return {
    id: '__prospect__',
    userId,
    employerId,
    status: 'scheduled',
    startTime: start,
    endTime: end,
    durationMinutes,
    breakMinutes,
    createdAt: now,
    updatedAt: now,
  };
}

export function RosterImpactPlanner() {
  const theme = useTheme<AppTheme>();
  const userId = useUserId() ?? 'local-user';
  const settings = useAuthStore((s) => s.settings);
  const context = useUserContext();
  const ruleProfile = useRuleProfile();
  const compliance = useCompliance();
  const { data: shifts = [] } = useShifts();
  const { data: employers = [] } = useEmployers();

  const [employerId, setEmployerId] = useState('');
  const [shiftDate, setShiftDate] = useState(defaultProspectiveFriday);
  const [startTime, setStartTime] = useState(() => {
    const time = new Date();
    time.setHours(9, 0, 0, 0);
    return time;
  });
  const [hours, setHours] = useState('8');
  const [breakMinutes, setBreakMinutes] = useState(String(DEFAULT_BREAK_MINUTES));
  const [menuOpen, setMenuOpen] = useState(false);

  const selectedEmployerId = employerId || employers[0]?.id || '';
  const selectedEmployer = employers.find((employer) => employer.id === selectedEmployerId);
  const warningPercentage = settings?.warningPercentage ?? 80;

  const parsedHours = parseFloat(hours) || 0;
  const parsedBreak = parseInt(breakMinutes.replace(/\D/g, ''), 10) || 0;

  const impact = useMemo(() => {
    if (!context || !compliance || parsedHours <= 0 || !selectedEmployerId) {
      return null;
    }

    const prospect = buildProspectiveShift(
      userId,
      selectedEmployerId,
      shiftDate,
      startTime,
      parsedHours,
      parsedBreak,
    );

    const validationErrors = validateShift(prospect, shifts, context);
    const after = simulateFutureShift(
      shifts,
      prospect,
      context,
      ruleProfile,
      new Date(),
      warningPercentage,
    );

    return {
      prospect,
      validationErrors,
      after,
      before: compliance,
      fits:
        compliance.isUnlimited ||
        (validationErrors.length === 0 && after.status !== 'violation'),
    };
  }, [
    context,
    compliance,
    parsedHours,
    parsedBreak,
    selectedEmployerId,
    shiftDate,
    startTime,
    shifts,
    userId,
    ruleProfile,
    warningPercentage,
  ]);

  if (!context || !compliance) {
    return null;
  }

  const statusColor = impact
    ? getComplianceColor(impact.after.status, theme)
    : theme.colors.onSurfaceVariant;

  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Content style={styles.content}>
        <Text variant="titleMedium" style={styles.title}>
          Roster Impact Planner
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Model a prospective shift to see if it fits your rolling compliance window before you
          accept it.
        </Text>

        {employers.length === 0 ? (
          <Text variant="bodyMedium">Add an employer first to plan shifts.</Text>
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

            <InlineCalendarField label="Shift date" value={shiftDate} onChange={setShiftDate} />

            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <TimeField label="Start time" value={startTime} onChange={setStartTime} />
              </View>
              <View style={styles.timeField}>
                <TextInput
                  label="Hours"
                  value={hours}
                  onChangeText={setHours}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  style={styles.hoursInput}
                />
              </View>
            </View>

            <TextInput
              label="Break (minutes)"
              value={breakMinutes}
              onChangeText={setBreakMinutes}
              keyboardType="number-pad"
              mode="outlined"
              style={styles.field}
            />

            {impact ? (
              <View style={[styles.result, { borderColor: statusColor }]}>
                <Text variant="titleSmall" style={{ color: statusColor, fontWeight: '700' }}>
                  {compliance.isUnlimited
                    ? 'Unlimited period — no cap applies'
                    : impact.fits
                      ? 'Fits within your limit'
                      : 'Does not fit'}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {format(impact.prospect.startTime, 'EEE d MMM · h:mm a')} ·{' '}
                  {formatHours(parsedHours)}h worked
                  {selectedEmployer ? ` · ${selectedEmployer.name}` : ''}
                </Text>

                {impact.validationErrors.length > 0 ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                    {impact.validationErrors[0]!.message}
                  </Text>
                ) : (
                  <>
                    <Text variant="bodyMedium">
                      Peak window: {formatHours(impact.before.peakProjectedHours)}h →{' '}
                      {formatHours(impact.after.peakProjectedHours)}h (cap {compliance.maxHours}h)
                    </Text>
                    <Text variant="bodyMedium">
                      Remaining buffer: {formatHours(impact.before.remainingHours)}h →{' '}
                      {formatHours(impact.after.remainingHours)}h
                    </Text>
                  </>
                )}
              </View>
            ) : null}
          </>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  content: { gap: spacing.sm },
  title: { fontWeight: '600' },
  field: { marginTop: spacing.xs },
  timeRow: { flexDirection: 'row', gap: spacing.md },
  timeField: { flex: 1 },
  hoursInput: { marginTop: 28 },
  result: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.xs,
  },
});
