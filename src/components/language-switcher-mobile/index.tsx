'use client';

import { Button, ButtonGroup } from '@heroui/react';
import { useLanguageSwitcher } from '@/hooks/use-language-switcher';

export function LanguageSwitcherMobile({
  setIsMenuOpen,
}: {
  setIsMenuOpen: (isOpen: boolean) => void;
}) {
  const { currentLang, switchLanguage } = useLanguageSwitcher();

  return (
    <ButtonGroup>
      <Button
        className='w-full'
        color={currentLang === 'en' ? 'success' : 'default'}
        variant='flat'
        onPress={() => {
          switchLanguage('en');
          setIsMenuOpen(false);
        }}
      >
        English
      </Button>
      <Button
        className='w-full'
        color={currentLang === 'es' ? 'success' : 'default'}
        variant='flat'
        onPress={() => {
          switchLanguage('es');
          setIsMenuOpen(false);
        }}
      >
        Español
      </Button>
    </ButtonGroup>
  );
}
