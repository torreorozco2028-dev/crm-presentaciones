'use client';

import { Button } from '@heroui/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import LucideIcon from '@/components/lucide-icon';

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Button
      isIconOnly
      variant='light'
      aria-label='Switcher theme'
      radius='full'
      onPress={() => {
        if (theme === 'dark') {
          setTheme('light');
        } else {
          setTheme('dark');
        }
      }}
    >
      <LucideIcon name={theme === 'light' ? 'Moon' : 'Sun'} />
    </Button>
  );
}
