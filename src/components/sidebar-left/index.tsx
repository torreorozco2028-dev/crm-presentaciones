'use client';

import React from 'react';
import { Listbox, ListboxItem, ListboxSection, Image } from '@heroui/react';
import { menuOptions, MenuItem, MenuOptions } from './options';
import { usePathname } from 'next/navigation';
import LucideIcon from '../lucide-icon';
import { useTranslations } from 'next-intl';
import useUserRole from '../../lib/getUserRole';
import { useTheme } from 'next-themes';

const LOGO_WHITE = '/logo2.png';
const LOGO_DARK = '/logo1.png';

const organization = {
  name: 'STRUCTEC S.R.L.',
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
    // Skeleton estatico sin componentes de HeroUI: Listbox/ListboxItem generan
    // ids de accesibilidad (react-aria) que no son deterministas entre el
    // render del servidor y la rehidratacion del cliente, lo que dispara un
    // "hydration mismatch" aunque el contenido sea identico. Renderizamos el
    // Listbox real recien despues de montar, cuando ya no hay comparacion
    // contra el HTML del servidor.
    return (
      <div className='w-full animate-pulse p-1'>
        <div className='flex h-12 w-full items-center pt-2'>
          <div className='h-8 w-24 rounded bg-default-200' />
        </div>
        <div className='my-4 flex flex-col gap-4'>
          {Object.keys(menuOptions).map((section) => (
            <div key={section} className='flex flex-col gap-2'>
              <div className='h-3 w-16 rounded bg-default-200' />
              {(menuOptions[section as keyof MenuOptions] as MenuItem[])
                .filter((item) => {
                  if (!item.roles) return true;
                  return item.roles.includes(userRole);
                })
                .map((item) => (
                  <div
                    key={item.key}
                    className='h-12 w-full rounded-medium bg-default-100'
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const logoSrc = theme === 'dark' ? LOGO_WHITE : LOGO_DARK;

  return (
    <div className='w-full p-1'>
      <div className='flex h-12 w-full items-center pt-2'>
        <Image
          src={logoSrc}
          alt={organization.name}
          className='h-12 w-auto max-w-full object-contain'
        />
      </div>
      <Listbox
        aria-label='Sidebar Options'
        className='my-4'
        itemClasses={{
          base: 'px-3 pt-0 first:rounded-medium last:rounded-medium gap-3 h-12 data-[hover=true]:bg-warning-100 data-[hover=true]:text-foreground-700',
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
                      ? 'bg-warning/10 text-warning'
                      : ''
                  }
                  color='warning'
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
