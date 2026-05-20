import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { OnboardingProfile } from '../types/planning';
import { createLegacyStateStorage } from '../lib/storage/localStore';

interface SettingsStore {
  currency: string;
  locale: string;
  theme: 'light';
  sidebarCollapsed: boolean;
  onboarding: OnboardingProfile | null;
  setCurrency: (currency: string) => void;
  setLocale: (locale: string) => void;
  toggleSidebar: () => void;
  completeOnboarding: (profile: OnboardingProfile) => void;
  resetOnboarding: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      currency: 'USD',
      locale: 'en-US',
      theme: 'light',
      sidebarCollapsed: false,
      onboarding: null,
      setCurrency: (currency) => set({ currency }),
      setLocale: (locale) => set({ locale }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      completeOnboarding: (profile) => set({ onboarding: profile, currency: profile.currency }),
      resetOnboarding: () => set({ onboarding: null }),
    }),
    {
      name: 'flint-settings',
      version: 2,
      storage: createJSONStorage(() => createLegacyStateStorage(['finch-settings'])),
      migrate: (persistedState, version) => {
        const state = (persistedState ?? {}) as Partial<SettingsStore>;

        if (version < 2) {
          return {
            currency: state.currency ?? 'USD',
            locale: state.locale ?? 'en-US',
            theme: 'light',
            sidebarCollapsed: state.sidebarCollapsed ?? false,
            onboarding: state.onboarding ?? null,
          };
        }

        return state as SettingsStore;
      },
    }
  )
);
