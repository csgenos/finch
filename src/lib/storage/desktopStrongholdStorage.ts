import { appDataDir, join } from '@tauri-apps/api/path';
import { Stronghold, type Client, type Store } from '@tauri-apps/plugin-stronghold';
import type { StateStorage } from 'zustand/middleware';
import { encryptedStorage } from './encryptedStorage';

const DB_NAME = 'flint-desktop-vault';
const DB_VERSION = 1;
const STORE_NAME = 'secrets';
const VAULT_PASSWORD_KEY = 'flint-stronghold-password-v1';
const VAULT_CLIENT_NAME = 'flint-state-v1';
const LEGACY_STORAGE_KEYS = ['flint-finance', 'flint-settings', 'finch-finance'];

interface StrongholdContext {
  stronghold: Stronghold;
  store: Store;
}

let contextPromise: Promise<StrongholdContext> | null = null;

function openVaultDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function readVaultPassword(): Promise<string | null> {
  const db = await openVaultDb();
  return new Promise<string | null>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(VAULT_PASSWORD_KEY);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve((request.result as string | undefined) ?? null);
  }).finally(() => db.close());
}

async function writeVaultPassword(password: string): Promise<void> {
  const db = await openVaultDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(password, VAULT_PASSWORD_KEY);
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();
  }).finally(() => db.close());
}

function generateVaultPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function getVaultPassword(): Promise<string> {
  const existing = await readVaultPassword();
  if (existing) return existing;

  const generated = generateVaultPassword();
  await writeVaultPassword(generated);
  return generated;
}

async function getStrongholdContext(): Promise<StrongholdContext> {
  if (!contextPromise) {
    contextPromise = (async () => {
      const password = await getVaultPassword();
      const vaultPath = await join(await appDataDir(), 'flint-state.hold');
      const stronghold = await Stronghold.load(vaultPath, password);

      let client: Client;
      try {
        client = await stronghold.loadClient(VAULT_CLIENT_NAME);
      } catch {
        client = await stronghold.createClient(VAULT_CLIENT_NAME);
        await stronghold.save();
      }

      return {
        stronghold,
        store: client.getStore(),
      };
    })().catch(error => {
      contextPromise = null;
      throw error;
    });
  }

  return contextPromise;
}

async function migrateLegacyValue(name: string, store: Store, stronghold: Stronghold): Promise<string | null> {
  const legacyValue = await encryptedStorage.getItem(name);
  if (legacyValue === null) return null;

  await store.insert(name, Array.from(new TextEncoder().encode(legacyValue)));
  await stronghold.save();

  for (const key of LEGACY_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }

  return legacyValue;
}

export const desktopStrongholdStorage: StateStorage = {
  getItem: async (name) => {
    const { store, stronghold } = await getStrongholdContext();
    const value = await store.get(name);
    if (value) {
      return new TextDecoder().decode(value);
    }

    return migrateLegacyValue(name, store, stronghold);
  },
  setItem: async (name, value) => {
    const { store, stronghold } = await getStrongholdContext();
    await store.insert(name, Array.from(new TextEncoder().encode(value)));
    await stronghold.save();
    window.localStorage.removeItem(name);
  },
  removeItem: async (name) => {
    const { store, stronghold } = await getStrongholdContext();
    await store.remove(name);
    await stronghold.save();
    window.localStorage.removeItem(name);
  },
};
