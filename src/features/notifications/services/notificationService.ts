import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import type { ComplianceResult, Shift } from '@/types';

/**
 * Import local-notification APIs from deep paths.
 * Importing the package root loads DevicePushTokenAutoRegistration.fx,
 * which throws in Expo Go on Android (push tokens removed since SDK 53).
 */
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import { IosAuthorizationStatus } from 'expo-notifications/build/NotificationPermissions.types';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';

const ANDROID_CHANNEL_ID = 'workguard-reminders';

let handlerConfigured = false;
/** true = channel created; false = unavailable (e.g. Expo Go); null = not tried yet */
let androidChannelAvailable: boolean | null = null;

function reminderIdentifier(shiftId: string): string {
  return `shift-reminder-${shiftId}`;
}

function ensureNotificationHandler(): void {
  if (handlerConfigured) return;
  try {
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.warn('[notifications] Handler setup failed', error);
  }
  handlerConfigured = true;
}

/**
 * Expo Go Android does not provide NotificationsChannelsProvider, so channel
 * APIs throw. Skip them there; development/production builds still create a channel.
 */
async function ensureAndroidChannel(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (androidChannelAvailable !== null) return androidChannelAvailable;

  if (isRunningInExpoGo()) {
    androidChannelAvailable = false;
    return false;
  }

  try {
    await setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'WorkGuard reminders',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
    androidChannelAvailable = true;
  } catch (error) {
    console.warn('[notifications] Channel setup unavailable, continuing without it', error);
    androidChannelAvailable = false;
  }

  return androidChannelAvailable;
}

function androidTriggerChannelId(): string | undefined {
  return androidChannelAvailable ? ANDROID_CHANNEL_ID : undefined;
}

function hasNotificationPermission(status: {
  granted: boolean;
  ios?: { status: IosAuthorizationStatus };
}): boolean {
  return Boolean(
    status.granted ||
      status.ios?.status === IosAuthorizationStatus.PROVISIONAL ||
      status.ios?.status === IosAuthorizationStatus.AUTHORIZED,
  );
}

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    ensureNotificationHandler();
    await ensureAndroidChannel();

    const current = await getPermissionsAsync();
    if (hasNotificationPermission(current)) return true;

    const requested = await requestPermissionsAsync();
    return hasNotificationPermission(requested);
  } catch (error) {
    console.warn('[notifications] Permission request failed', error);
    return false;
  }
}

export async function scheduleThresholdNotifications(
  compliance: ComplianceResult,
  warningPercentage: number,
): Promise<void> {
  try {
    if (compliance.isUnlimited) return;

    const ratio = compliance.projectedHours / compliance.maxHours;
    const thresholds = [0.8, 0.9, 0.95, 1.0];
    const labels = ['80%', '90%', '95%', '100%'];

    for (let i = 0; i < thresholds.length; i += 1) {
      const threshold = thresholds[i]!;
      if (ratio >= threshold && threshold >= warningPercentage / 100) {
        const granted = await requestNotificationPermissions();
        if (!granted) return;

        await scheduleNotificationAsync({
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
  } catch (error) {
    console.warn('[notifications] Threshold schedule failed', error);
  }
}

export async function cancelShiftReminder(shiftId: string): Promise<void> {
  try {
    await cancelScheduledNotificationAsync(reminderIdentifier(shiftId));
  } catch {
    // Nothing scheduled with this id — ignore.
  }
}

export async function scheduleShiftReminder(
  shift: Shift,
  notificationsEnabled: boolean,
): Promise<void> {
  await cancelShiftReminder(shift.id);

  if (!notificationsEnabled) return;
  if (shift.reminderMinutes == null) return;
  if (shift.status === 'cancelled' || shift.deletedAt) return;

  const triggerDate = new Date(
    shift.startTime.getTime() - shift.reminderMinutes * 60 * 1000,
  );
  const msUntilTrigger = triggerDate.getTime() - Date.now();
  if (msUntilTrigger <= 1_000) return;

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const timeLabel = shift.startTime.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

  const content = {
    title: 'Upcoming shift',
    body:
      shift.reminderMinutes === 0
        ? `Your shift is starting (${timeLabel}).`
        : `Your shift starts at ${timeLabel}.`,
    data: { shiftId: shift.id },
    sound: true as const,
  };

  const channelId = androidTriggerChannelId();

  try {
    await scheduleNotificationAsync({
      identifier: reminderIdentifier(shift.id),
      content,
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        ...(channelId ? { channelId } : {}),
      },
    });
  } catch (dateError) {
    console.warn('[notifications] DATE trigger failed, trying interval', dateError);
    await scheduleNotificationAsync({
      identifier: reminderIdentifier(shift.id),
      content,
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.floor(msUntilTrigger / 1000)),
        ...(channelId ? { channelId } : {}),
      },
    });
  }
}

export async function scheduleHoursAvailableNotification(availableDate: Date): Promise<void> {
  try {
    const msUntil = availableDate.getTime() - Date.now();
    if (msUntil <= 1_000) return;
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    const channelId = androidTriggerChannelId();
    await scheduleNotificationAsync({
      content: {
        title: 'Hours becoming available',
        body: 'Additional work hours will become available in your rolling period.',
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: availableDate,
        ...(channelId ? { channelId } : {}),
      },
    });
  } catch (error) {
    console.warn('[notifications] Hours-available schedule failed', error);
  }
}
