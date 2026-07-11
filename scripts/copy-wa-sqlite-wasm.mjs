import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const src = path.join(root, 'node_modules', 'wa-sqlite', 'dist', 'wa-sqlite.wasm');
const destDir = path.join(root, 'node_modules', 'expo-sqlite', 'web', 'wa-sqlite');
const dest = path.join(destDir, 'wa-sqlite.wasm');

if (!fs.existsSync(src)) {
  console.warn('[postinstall] wa-sqlite.wasm not found — skip copy');
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('[postinstall] Copied wa-sqlite.wasm for expo-sqlite web support');
