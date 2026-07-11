import { ScrollView, StyleSheet, Alert } from 'react-native';
import { Button, Divider, List, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { subDays } from 'date-fns';

import { ScreenContainer } from '@/components';
import { deleteAccount, signOut } from '@/features/auth/services/authService';
import { exitGuestMode } from '@/features/auth/services/guestService';
import { exportShiftsCsv } from '@/features/reports/services/exportService';
import { useEmployers, useSemesterBreaks, useShifts } from '@/hooks/useCompliance';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';
import { useIsGuest } from '@/hooks/useUser';
import { useAuthStore } from '@/store';

function usesEmailPassword(session: ReturnType<typeof useAuthStore.getState>['session']) {
  if (!session?.user) return false;
  const providers = session.user.app_metadata?.providers as string[] | undefined;
  if (providers?.includes('email')) return true;
  return session.user.identities?.some((i) => i.provider === 'email') ?? false;
}

export default function SettingsScreen() {
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const settings = useAuthStore((s) => s.settings);
  const reset = useAuthStore((s) => s.reset);
  const isGuest = useIsGuest();
  const { data: shifts = [] } = useShifts();
  const { data: employers = [] } = useEmployers();
  const { data: breaks = [] } = useSemesterBreaks();
  const canChangePassword = !isGuest && usesEmailPassword(session);

  const handleExportCsv = async () => {
    try {
      const weekShifts = shifts.filter((s) => s.startTime >= subDays(new Date(), 7));
      await exportShiftsCsv(weekShifts, employers, 'workguard-weekly.csv');
    } catch (error) {
      Alert.alert(
        'Export failed',
        error instanceof Error ? error.message : 'Could not export CSV.',
      );
    }
  };

  const handleExitGuest = async (clearData: boolean) => {
    await exitGuestMode(clearData);
    reset();
    router.replace('/(auth)/login');
  };

  const handleCreateAccountFromGuest = async () => {
    await exitGuestMode(false);
    reset();
    router.replace('/(auth)/login');
  };

  const shiftLabelCount = settings?.shiftSchedules?.length ?? 0;
  const { scrollPaddingBottom } = useTabBarLayout();

  return (
    <ScreenContainer title="Settings">
      <ScrollView contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}>
        {isGuest && (
          <Text variant="bodySmall" style={styles.guestBanner}>
            Guest mode — data is stored on this device only and is not synced to the cloud.
          </Text>
        )}
        <List.Section>
          <List.Subheader>Account</List.Subheader>
          <List.Item
            title={profile?.fullName ?? '—'}
            description={isGuest ? 'Local guest profile' : profile?.email}
            left={(p) => <List.Icon {...p} icon="account" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => router.push('/settings/profile')}
          />
          {canChangePassword && (
            <List.Item
              title="Change password"
              description="Update your sign-in password"
              left={(p) => <List.Icon {...p} icon="lock" />}
              right={(p) => <List.Icon {...p} icon="chevron-right" />}
              onPress={() => router.push('/settings/change-password')}
            />
          )}
          {isGuest && (
            <List.Item
              title="Create account"
              description="Sign up to sync your data across devices"
              left={(p) => <List.Icon {...p} icon="account-plus" />}
              right={(p) => <List.Icon {...p} icon="chevron-right" />}
              onPress={handleCreateAccountFromGuest}
            />
          )}
        </List.Section>
        <Divider />
        <List.Section>
          <List.Subheader>Work</List.Subheader>
          <List.Item
            title="Employers"
            description={
              employers.length > 0
                ? `${employers.length} employer${employers.length === 1 ? '' : 's'}`
                : 'Add workplaces for your shifts'
            }
            left={(p) => <List.Icon {...p} icon="briefcase" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => router.push('/settings/employers')}
          />
          <List.Item
            title="Shift labels"
            description={
              shiftLabelCount > 0
                ? `${shiftLabelCount} label${shiftLabelCount === 1 ? '' : 's'}`
                : undefined
            }
            left={(p) => <List.Icon {...p} icon="label" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => router.push('/settings/shift-labels')}
          />
        </List.Section>
        <Divider />
        <List.Section>
          <List.Subheader>Preferences</List.Subheader>
          <List.Item
            title="App settings"
            description={`Theme: ${settings?.theme ?? 'light'} · Warning at ${settings?.warningPercentage ?? 80}%`}
            left={(p) => <List.Icon {...p} icon="tune" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => router.push('/settings/app-settings')}
          />
          <List.Item
            title="Semester breaks"
            description={
              breaks.length > 0
                ? `${breaks.length} break${breaks.length === 1 ? '' : 's'} configured`
                : 'Add university holiday periods'
            }
            left={(p) => <List.Icon {...p} icon="beach" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => router.push('/settings/semester-breaks')}
          />
        </List.Section>
        <Divider />
        <List.Section>
          <List.Subheader>Reports</List.Subheader>
          <Button mode="outlined" onPress={handleExportCsv} style={styles.btn}>
            Export Weekly CSV
          </Button>
        </List.Section>
        {isGuest ? (
          <>
            <Button mode="outlined" onPress={() => handleExitGuest(false)} style={styles.btn}>
              Exit Guest Mode
            </Button>
            <Button mode="text" textColor="#D32F2F" onPress={() => handleExitGuest(true)}>
              Clear Guest Data & Exit
            </Button>
          </>
        ) : (
          <>
            <Button
              mode="outlined"
              onPress={async () => {
                await signOut();
                router.replace('/(auth)/login');
              }}
              style={styles.btn}
            >
              Sign Out
            </Button>
            <Button
              mode="text"
              textColor="#D32F2F"
              onPress={async () => {
                await deleteAccount();
                router.replace('/(auth)/login');
              }}
            >
              Delete Account
            </Button>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  btn: { marginVertical: 4, marginHorizontal: 16 },
  guestBanner: {
    paddingHorizontal: 16,
    marginBottom: 8,
    lineHeight: 20,
    opacity: 0.85,
    color: '#006A6A',
  },
});
