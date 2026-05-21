import { APP_NAME, APP_RELEASE_CHANNEL, APP_VERSION } from '../appInfo';
import { isDesktopRuntime } from './runtime';

const PBKDF2_ITERATIONS = 250_000;

export const BACKUP_SNAPSHOT_FORMAT = 'flint-backup-v2';
export const ENCRYPTED_BACKUP_FORMAT = 'flint-encrypted-backup-v2';
const LEGACY_ENCRYPTED_BACKUP_FORMAT = 'flint-encrypted-backup-v1';

export interface BackupSummary {
  accounts: number;
  transactions: number;
  budgets: number;
  categories: number;
  scenarios: number;
  paychecks: number;
  recurringExpenses: number;
  goals: number;
  netWorthSnapshots: number;
}

export interface BackupSnapshot {
  format: typeof BACKUP_SNAPSHOT_FORMAT;
  schemaVersion: 2;
  createdAt: string;
  app: {
    name: typeof APP_NAME;
    version: string;
    releaseChannel: 'stable' | 'beta';
    platform: 'desktop' | 'web';
  };
  summary: BackupSummary;
  finance: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export interface EncryptedBackupEnvelope {
  format: typeof ENCRYPTED_BACKUP_FORMAT;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function deriveBackupKey(passphrase: string, salt: Uint8Array, iterations = PBKDF2_ITERATIONS): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: toArrayBuffer(salt), iterations, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function countArray(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

export function summarizeFinancePayload(finance: Record<string, unknown>): BackupSummary {
  return {
    accounts: countArray(finance.accounts),
    transactions: countArray(finance.transactions),
    budgets: countArray(finance.budgets),
    categories: countArray(finance.categories),
    scenarios: countArray(finance.scenarios),
    paychecks: countArray(finance.paychecks),
    recurringExpenses: countArray(finance.recurringExpenses),
    goals: countArray(finance.goals),
    netWorthSnapshots: countArray(finance.netWorthSnapshots),
  };
}

export function createBackupSnapshot(finance: Record<string, unknown>, settings: Record<string, unknown>): BackupSnapshot {
  return {
    format: BACKUP_SNAPSHOT_FORMAT,
    schemaVersion: 2,
    createdAt: new Date().toISOString(),
    app: {
      name: APP_NAME,
      version: APP_VERSION,
      releaseChannel: APP_RELEASE_CHANNEL,
      platform: isDesktopRuntime() ? 'desktop' : 'web',
    },
    summary: summarizeFinancePayload(finance),
    finance,
    settings,
  };
}

export async function encryptBackupSnapshot(snapshot: BackupSnapshot, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveBackupKey(passphrase, salt);
  const plaintext = JSON.stringify(snapshot);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, new TextEncoder().encode(plaintext));

  const envelope: EncryptedBackupEnvelope = {
    format: ENCRYPTED_BACKUP_FORMAT,
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };

  return JSON.stringify(envelope, null, 2);
}

export async function decryptBackupPayload(envelope: Record<string, unknown>, passphrase: string): Promise<unknown> {
  const format = String(envelope.format ?? '');
  if (format !== ENCRYPTED_BACKUP_FORMAT && format !== LEGACY_ENCRYPTED_BACKUP_FORMAT) {
    return envelope;
  }

  const salt = base64ToBytes(String(envelope.salt ?? ''));
  const iv = base64ToBytes(String(envelope.iv ?? ''));
  const ciphertext = base64ToBytes(String(envelope.ciphertext ?? ''));
  const iterations = format === ENCRYPTED_BACKUP_FORMAT ? Number(envelope.iterations ?? PBKDF2_ITERATIONS) : PBKDF2_ITERATIONS;
  const key = await deriveBackupKey(passphrase, salt, iterations);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(ciphertext));
  return JSON.parse(new TextDecoder().decode(plaintext));
}

export function normalizeBackupSnapshot(payload: unknown): BackupSnapshot {
  if (!isRecord(payload)) {
    throw new Error('Backup file is not a JSON object.');
  }

  if (payload.format === BACKUP_SNAPSHOT_FORMAT && isRecord(payload.finance) && isRecord(payload.settings)) {
    return payload as unknown as BackupSnapshot;
  }

  return createBackupSnapshot(payload, {});
}
