import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHUNK_SIZE = 2048;

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

/** Secure storage adapter for Supabase auth session persistence. */
export const secureStorage = {
  getItem,
  setItem,
  removeItem,
};

export async function getLargeItem(key: string): Promise<string | null> {
  const countStr = await getItem(`${key}_chunks`);
  if (!countStr) return getItem(key);
  const count = parseInt(countStr, 10);
  const chunks: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const chunk = await getItem(`${key}_${i}`);
    if (chunk === null) return null;
    chunks.push(chunk);
  }
  return chunks.join('');
}

export async function setLargeItem(key: string, value: string): Promise<void> {
  if (value.length <= CHUNK_SIZE) {
    await setItem(key, value);
    await removeItem(`${key}_chunks`);
    return;
  }
  const chunks = Math.ceil(value.length / CHUNK_SIZE);
  await setItem(`${key}_chunks`, String(chunks));
  for (let i = 0; i < chunks; i += 1) {
    await setItem(`${key}_${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
  }
}
