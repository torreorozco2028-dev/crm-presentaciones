'use client';

import { Button, ButtonGroup } from '@heroui/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import LucideIcon from '@/components/lucide-icon';

export function ThemeSwitcherMobile({ setIsMenuOpen }: any) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ButtonGroup>
      <Button
        className='w-full'
        onPress={() => {
          setTheme('light');
          setIsMenuOpen(false);
        }}
        color={theme === 'light' ? 'primary' : 'default'}
        variant={theme === 'light' ? 'solid' : 'flat'}
      >
        <LucideIcon name='Sun' />
      </Button>
      <Button
        className='w-full'
        color={theme === 'dark' ? 'primary' : 'default'}
        onPress={() => {
          setTheme('dark');
          setIsMenuOpen(false);
        }}
        variant={theme === 'light' ? 'solid' : 'flat'}
      >
        <LucideIcon name='Moon' />
      </Button>
    </ButtonGroup>
  );
}
