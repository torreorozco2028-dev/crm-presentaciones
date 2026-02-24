'use client';

import React from 'react';
import { Listbox, ListboxItem, ListboxSection, Image } from '@heroui/react';
import { menuOptions, MenuItem, MenuOptions } from './options';
import { usePathname } from 'next/navigation';
import LucideIcon from '../lucide-icon';
import { useTranslations } from 'next-intl';
import useUserRole from '../../lib/getUserRole';
import { useTheme } from 'next-themes';

const organization = {
  name: 'STRUCTEC S.R.L.',
  logo: '/logo.png',
};

export default function SideBarLeft() {
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/^\/(es|en)/, '');
  const userRole = useUserRole() || 'user';
  const { theme } = useTheme();
  const t = useTranslations('Common');
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Loader skeleton mientras espera el cliente
    return (
      <div className='w-full p-1'>
        <div className='flex h-36 w-64 items-center pt-2'></div>
        <Listbox
          aria-label='Sidebar Options'
          className='my-4'
          itemClasses={{
            base: 'px-3 pt-0 first:rounded-medium last:rounded-medium gap-3 h-12 data-[hover=true]:bg-success-100 data-[hover=true]:text-foreground-700',
          }}
        >
          {Object.keys(menuOptions).map((section) => (
            <ListboxSection
              title={t(`menu.${section}`).toUpperCase()}
              key={section}
            >
              {(menuOptions[section as keyof MenuOptions] as MenuItem[])
                .filter((item) => {
                  if (!item.roles) return true;
                  return item.roles.includes(userRole);
                })
                .map((item) => (
                  <ListboxItem
                    key={item.key}
                    href={item.path}
                    className={
                      pathname === item.path ? 'bg-primary/10 text-primary' : ''
                    }
                    color='primary'
                    startContent={<LucideIcon name={item.icon} />}
                    endContent={
                      pathname === item.path ? (
                        <LucideIcon name='ChevronRight' />
                      ) : (
                        false
                      )
                    }
                  >
                    {t(item.label)}
                  </ListboxItem>
                ))}
            </ListboxSection>
          ))}
        </Listbox>
      </div>
    );
  }

  return (
    <div className='w-full p-1'>
      <div className='flex h-16 w-16 items-center pt-2'>
        <Image
          src={theme === 'dark' ? organization.logo : organization.logo}
          alt='Logo'
          className='h-auto max-w-full'
        />
      </div>
      <Listbox
        aria-label='Sidebar Options'
        className='my-4'
        itemClasses={{
          base: 'px-3 pt-0 first:rounded-medium last:rounded-medium gap-3 h-12 data-[hover=true]:bg-success-100 data-[hover=true]:text-foreground-700',
        }}
      >
        {Object.keys(menuOptions).map((section) => (
          <ListboxSection
            title={t(`menu.${section}`).toUpperCase()}
            key={section}
          >
            {(menuOptions[section as keyof MenuOptions] as MenuItem[])
              .filter((item) => {
                if (!item.roles) return true;
                return item.roles.includes(userRole);
              })
              .map((item) => (
                <ListboxItem
                  key={item.key}
                  href={item.path}
                  className={
                    normalizedPath === item.path
                      ? 'bg-primary/10 text-primary'
                      : ''
                  }
                  color='primary'
                  startContent={<LucideIcon name={item.icon} />}
                  endContent={
                    pathname === item.path ? (
                      <LucideIcon name='ChevronRight' />
                    ) : (
                      false
                    )
                  }
                >
                  {t(item.label)}
                </ListboxItem>
              ))}
          </ListboxSection>
        ))}
      </Listbox>
    </div>
  );
}
