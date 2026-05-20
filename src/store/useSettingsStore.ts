import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OnboardingProfile } from '../types/planning';

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
    { name: 'finch-settings' }
  )
);
