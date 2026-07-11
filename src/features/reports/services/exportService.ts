import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { Employer, Shift } from '@/types';
import { formatHours, minutesToHours } from '@/utils/time';

async function shareExportedFile(
  uri: string,
  mimeType: string,
  dialogTitle: string,
  filename: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof document === 'undefined') {
      throw new Error('Download is not supported in this browser.');
    }
    const response = await fetch(uri);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return;
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType, dialogTitle });
    return;
  }

  throw new Error('Sharing is not available on this device.');
}

export async function exportShiftsCsv(
  shifts: Shift[],
  employers: Employer[],
  filename: string,
): Promise<void> {
  const employerMap = Object.fromEntries(employers.map((e) => [e.id, e.name]));
  const header = 'Employer,Start,End,Duration (hours),Status,Notes\n';
  const rows = shifts
    .map((s) => {
      const employer = employerMap[s.employerId] ?? 'Unknown';
      return [
        employer,
        format(s.startTime, 'yyyy-MM-dd HH:mm'),
        format(s.endTime, 'yyyy-MM-dd HH:mm'),
        formatHours(minutesToHours(s.durationMinutes)),
        s.status,
        s.notes ?? '',
      ].join(',');
    })
    .join('\n');

  const path = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, header + rows);
  await shareExportedFile(path, 'text/csv', 'Export CSV', filename);
}

export async function exportAllDataJson(data: unknown, filename: string): Promise<void> {
  const path = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
  await shareExportedFile(path, 'application/json', 'Export Data', filename);
}
