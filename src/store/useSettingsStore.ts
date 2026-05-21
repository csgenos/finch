import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { stateStorage } from '../lib/storage/stateStorage';
import { OnboardingProfile } from '../types/planning';
import { inferTaxResidency } from '../data/taxes/jurisdictions';

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
  restoreFromBackup: (data: Partial<Pick<SettingsStore, 'currency' | 'locale' | 'theme' | 'sidebarCollapsed' | 'onboarding'>>) => void;
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
      restoreFromBackup: (data) => set((state) => ({
        currency: data.currency ?? state.currency,
        locale: data.locale ?? state.locale,
        theme: data.theme ?? state.theme,
        sidebarCollapsed: data.sidebarCollapsed ?? state.sidebarCollapsed,
        onboarding: data.onboarding ?? state.onboarding,
      })),
    }),
    {
      name: 'flint-settings',
      version: 4,
      storage: createJSONStorage(() => stateStorage),
      migrate: (persistedState, version) => {
        const state = (persistedState ?? {}) as Partial<SettingsStore>;

        const onboarding = state.onboarding
          ? {
              ...state.onboarding,
              incomeType: state.onboarding.incomeType ?? 'monthly',
              taxResidency:
                state.onboarding.taxResidency ??
                inferTaxResidency(state.onboarding.country, state.onboarding.state),
            }
          : null;

        if (version < 4) {
          return {
            currency: state.currency ?? 'USD',
            locale: state.locale ?? 'en-US',
            theme: 'light' as const,
            sidebarCollapsed: state.sidebarCollapsed ?? false,
            onboarding,
          };
        }

        return { ...state, onboarding } as SettingsStore;
      },
    }
  )
);
