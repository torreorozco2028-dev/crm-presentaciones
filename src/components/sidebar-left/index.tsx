'use client';

import React from 'react';
import { Listbox, ListboxItem, ListboxSection, Avatar } from '@heroui/react';
import { menuOptions, MenuItem, MenuOptions } from './options';
import { usePathname } from 'next/navigation';
import LucideIcon from '../lucide-icon';
import { useTranslations } from 'next-intl';

const organization = {
  name: 'STRUCTEC S.R.L.',
  logo: '/logo.png',
};

export default function SideBarLeft() {
  const pathname = usePathname();
  const t = useTranslations('Common');
  return (
    <div className='w-full'>
      <div className='flex items-center gap-1 p-2'>
        <Avatar src={organization.logo} className='bg-inherint' size='sm' />
        <p className='inline-block align-middle font-bold'>
          {organization.name}
        </p>
      </div>
      <Listbox
        aria-label='Sidebar Options'
        className='my-4'
        itemClasses={{
          base: 'px-3 first:rounded-medium last:rounded-medium gap-3 h-12 data-[hover=true]:bg-primary/20 data-[hover=true]:text-primary',
        }}
      >
        {Object.keys(menuOptions).map((section) => (
          <ListboxSection
            title={t(`menu.${section}`).toUpperCase()}
            key={section}
          >
            {(menuOptions[section as keyof MenuOptions] as MenuItem[]).map(
              (item) => (
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
              )
            )}
          </ListboxSection>
        ))}
      </Listbox>
    </div>
  );
}
