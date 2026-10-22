'use client';

import React from 'react';
import Link from 'next/link';
import { Image } from '@heroui/react';
import { useSidebar } from '../sidebar-provider';
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
  const { collapsed } = useSidebar();
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
  const currentLang = pathname.split('/')[1];
  // En modo colapsado solo se ven los iconos; el texto se oculta con fade.
  const fade = `whitespace-nowrap transition-opacity duration-200 ${
    collapsed ? 'pointer-events-none opacity-0' : 'opacity-100 delay-100'
  }`;

  return (
    <div className='flex h-full w-full flex-col overflow-x-hidden p-3'>
      <div
        className={`relative flex w-full shrink-0 items-center overflow-hidden transition-[height] duration-300 ${
          collapsed ? 'h-0' : 'h-12'
        }`}
      >
        <Image
          src={logoSrc}
          alt={organization.name}
          className={`h-12 w-auto max-w-full object-contain transition-opacity duration-200 ${
            collapsed ? 'opacity-0' : 'opacity-100 delay-100'
          }`}
        />
      </div>
      <nav
        aria-label='Sidebar Options'
        className='mt-4 flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      >
        {Object.keys(menuOptions).map((section) => (
          <div key={section} className='flex flex-col gap-1'>
            <div className='relative h-5 px-3'>
              <span
                className={`absolute left-3 text-tiny font-semibold text-foreground-400 ${fade}`}
              >
                {t(`menu.${section}`).toUpperCase()}
              </span>
              <span
                className={`absolute inset-x-3 top-1/2 border-t border-divider transition-opacity duration-200 ${
                  collapsed ? 'opacity-100 delay-100' : 'opacity-0'
                }`}
              />
            </div>
            {(menuOptions[section as keyof MenuOptions] as MenuItem[])
              .filter((item) => {
                if (!item.roles) return true;
                return item.roles.includes(userRole);
              })
              .map((item) => {
                const isActive = normalizedPath === item.path;
                return (
                  <Link
                    key={item.key}
                    href={`/${currentLang}${item.path}`}
                    aria-label={t(item.label)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative flex h-12 items-center gap-3 rounded-medium px-3 transition-colors hover:bg-warning-100 hover:text-foreground-700 ${
                      isActive
                        ? 'bg-warning/10 font-medium text-warning'
                        : 'text-foreground-600'
                    }`}
                  >
                    {isActive && (
                      <span className='absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-warning' />
                    )}
                    <span className='flex h-6 w-6 shrink-0 items-center justify-center'>
                      <LucideIcon name={item.icon} />
                    </span>
                    <span className={`flex-1 truncate text-small ${fade}`}>
                      {t(item.label)}
                    </span>
                    {isActive && (
                      <span className={fade}>
                        <LucideIcon name='ChevronRight' />
                      </span>
                    )}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>
    </div>
  );
}
