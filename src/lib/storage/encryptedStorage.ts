/**
 * AES-256-GCM encrypted wrapper for Zustand persist storage.
 *
 * The key is a non-extractable AES-GCM CryptoKey persisted in IndexedDB.
 * That does not make browser local storage a high-assurance vault, but it
 * avoids shipping a static derivation secret beside the ciphertext.
 * This addresses casual inspection via DevTools and generic malware scanning.
 *
 * Upgrade path for higher assurance: replace this adapter with
 * @tauri-apps/plugin-stronghold (OS keychain / hardware enclave) when
 * distributing signed production builds.
 */

import { type StateStorage } from 'zustand/middleware';

const DB_NAME = 'flint-secure-storage';
const DB_VERSION = 1;
const STORE_NAME = 'keys';
const DATA_KEY_ID = 'flint-finance-data-key-v1';
const LEGACY_PLAINTEXT_KEYS = new Set(['flint-finance', 'flint-settings', 'finch-finance']);

let _key: CryptoKey | null = null;

function openKeyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function readStoredKey(): Promise<CryptoKey | null> {
  const db = await openKeyDb();
  return new Promise<CryptoKey | null>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(DATA_KEY_ID);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve((request.result as CryptoKey | undefined) ?? null);
  }).finally(() => db.close());
}

async function writeStoredKey(key: CryptoKey): Promise<void> {
  const db = await openKeyDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(key, DATA_KEY_ID);
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();
  }).finally(() => db.close());
}

async function getKey(): Promise<CryptoKey> {
  if (_key) return _key;

  const storedKey = await readStoredKey();
  if (storedKey) {
    _key = storedKey;
    return _key;
  }

  _key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  await writeStoredKey(_key);

  return _key;
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  const combined = new Uint8Array(12 + cipherBuf.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuf), 12);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(cipherB64: string): Promise<string> {
  const key = await getKey();
  const combined = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: combined.slice(0, 12) },
    key,
    combined.slice(12)
  );
  return new TextDecoder().decode(decrypted);
}

export const encryptedStorage: StateStorage = {
  getItem: async (name) => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    try {
      return await decrypt(raw);
    } catch {
      const trimmed = raw.trim();
      if (LEGACY_PLAINTEXT_KEYS.has(name) && trimmed.startsWith('{') && trimmed.endsWith('}')) {
        return raw;
      }
      console.warn(`Ignoring unreadable encrypted state for ${name}`);
      return null;
    }
  },
  setItem: async (name, value) => {
    localStorage.setItem(name, await encrypt(value));
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};
