import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const CSV_MIME_TYPES = Platform.select({
  ios: ['public.comma-separated-values-text', 'public.text', 'public.data'],
  android: ['text/csv', 'text/comma-separated-values', 'application/csv', 'text/plain', '*/*'],
  default: ['text/csv', 'text/comma-separated-values', 'application/csv', 'text/plain'],
});

export async function pickCsvFile(): Promise<{ name: string; content: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: CSV_MIME_TYPES,
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  const content = await FileSystem.readAsStringAsync(asset.uri);
  return { name: asset.name, content };
}
