import type { StateStorage } from 'zustand/middleware';
import { isDesktopRuntime } from './runtime';
import { encryptedStorage } from './encryptedStorage';
import { desktopStrongholdStorage } from './desktopStrongholdStorage';

export const stateStorage: StateStorage = {
  getItem: async (name) => {
    if (isDesktopRuntime()) {
      try {
        return await desktopStrongholdStorage.getItem(name);
      } catch (error) {
        console.warn(`Falling back to browser storage for ${name}`, error);
      }
    }

    return encryptedStorage.getItem(name);
  },
  setItem: async (name, value) => {
    if (isDesktopRuntime()) {
      try {
        await desktopStrongholdStorage.setItem(name, value);
        return;
      } catch (error) {
        console.warn(`Falling back to browser storage for ${name}`, error);
      }
    }

    await encryptedStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    if (isDesktopRuntime()) {
      try {
        await desktopStrongholdStorage.removeItem(name);
        return;
      } catch (error) {
        console.warn(`Falling back to browser storage for ${name}`, error);
      }
    }

    await encryptedStorage.removeItem(name);
  },
};
