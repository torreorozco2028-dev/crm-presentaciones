'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Locale, i18n } from '@/i18n-config';

type LocaleStore = {
  preferredLocale: Locale;
  setPreferredLocale: (locale: Locale) => void;
  availableLocales: Locale[];
  defaultLocale: Locale;
  isValidLocale: (locale: string) => locale is Locale;
};

const getInitialLocale = (): Locale => {
  return i18n.defaultLocale as Locale;
};

export const useLocaleStore = create<LocaleStore>()(
  persist<LocaleStore>(
    (set) => ({
      preferredLocale: getInitialLocale(),
      availableLocales: i18n.locales as Locale[],
      defaultLocale: i18n.defaultLocale as Locale,
      setPreferredLocale: (locale: Locale) => set({ preferredLocale: locale }),
      isValidLocale: (locale: string): locale is Locale =>
        i18n.locales.includes(locale as Locale),
    }),
    {
      name: 'locale-storage',
    }
  )
);
