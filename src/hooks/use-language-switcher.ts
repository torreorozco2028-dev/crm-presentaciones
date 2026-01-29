'use client';

import { useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { type Locale, i18n } from '@/i18n-config';
import { useLocaleStore } from '@/stores/locale-store';

export function useLanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { setPreferredLocale, isValidLocale } = useLocaleStore();

  const currentLang = pathname.split('/')[1];
  const validCurrentLang = isValidLocale(currentLang)
    ? currentLang
    : i18n.defaultLocale;

  useEffect(() => {
    if (validCurrentLang) {
      setPreferredLocale(validCurrentLang as Locale);
    }
  }, [validCurrentLang, setPreferredLocale]);

  const switchLanguage = useCallback(
    (locale: Locale) => {
      if (!isValidLocale(locale)) return;

      setPreferredLocale(locale);
      const segments = pathname.split('/');
      segments[1] = locale;
      const newPath = segments.join('/');

      router.push(newPath);
      router.refresh();
    },
    [pathname, router, setPreferredLocale, isValidLocale]
  );

  return {
    currentLang: validCurrentLang,
    switchLanguage,
    availableLocales: i18n.locales as Locale[],
  };
}
