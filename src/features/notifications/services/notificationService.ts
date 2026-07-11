import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { ComplianceResult, Shift } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'WorkGuard',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleThresholdNotifications(
  compliance: ComplianceResult,
  warningPercentage: number,
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (compliance.isUnlimited) return;

  const ratio = compliance.projectedHours / compliance.maxHours;
  const thresholds = [0.8, 0.9, 0.95, 1.0];
  const labels = ['80%', '90%', '95%', '100%'];

  for (let i = 0; i < thresholds.length; i += 1) {
    const threshold = thresholds[i]!;
    if (ratio >= threshold && threshold >= warningPercentage / 100) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: threshold >= 1 ? 'Work limit reached' : 'Work hours warning',
          body:
            threshold >= 1
              ? 'You have reached your visa work hour limit in the current period.'
              : `You have used ${labels[i]} of your allowed work hours.`,
        },
        trigger: null,
      });
      break;
    }
  }
}

export async function scheduleUpcomingShiftReminder(shift: Shift): Promise<void> {
  const trigger = new Date(shift.startTime.getTime() - 60 * 60 * 1000);
  if (trigger <= new Date()) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Upcoming shift',
      body: `Your shift starts at ${shift.startTime.toLocaleTimeString()}`,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
  });
}

export async function scheduleHoursAvailableNotification(availableDate: Date): Promise<void> {
  if (availableDate <= new Date()) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hours becoming available',
      body: 'Additional work hours will become available in your rolling period.',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: availableDate },
  });
}
