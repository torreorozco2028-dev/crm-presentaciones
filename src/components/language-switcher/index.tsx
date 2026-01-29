'use client';

import { Button, ButtonGroup } from '@heroui/react';
import { useLanguageSwitcher } from '@/hooks/use-language-switcher';

export function LanguageSwitcher() {
  const { currentLang, switchLanguage } = useLanguageSwitcher();

  return (
    <ButtonGroup>
      <Button
        color={currentLang === 'en' ? 'success' : 'default'}
        variant='flat'
        onPress={() => switchLanguage('en')}
      >
        English
      </Button>
      <Button
        color={currentLang === 'es' ? 'success' : 'default'}
        variant='flat'
        onPress={() => switchLanguage('es')}
      >
        Español
      </Button>
    </ButtonGroup>
  );
}
