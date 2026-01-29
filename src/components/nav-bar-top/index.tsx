'use client';
import React from 'react';
import {
  Navbar,
  NavbarBrand,
  NavbarMenuToggle,
  NavbarMenuItem,
  NavbarMenu,
  NavbarContent,
  NavbarItem,
  Link,
  Divider,
  Avatar,
  User,
} from '@heroui/react';
import { MenuItem, MenuOptions, menuOptions } from '../sidebar-left/options';
import { ThemeSwitcher } from '../theme-switcher';
import { usePathname } from 'next/navigation';
import getNavbarBrand from '@/lib/get-navbar-brand';
import LucideIcon from '../lucide-icon';
import { ThemeSwitcherMobile } from '../theme-switcher-mobile';
import SignOutBtnMobile from '../sign-out-btn-mobile';
import UserDropdownMenu from '../user-dropdown-menu';
import TitleNavBar from '../title-nav-bar';
import { LanguageSwitcher } from '../language-switcher';
import { Locale } from '@/i18n-config';
import { LanguageSwitcherMobile } from '../language-switcher-mobile';
import { useTranslations } from 'next-intl';

interface UserData {
  user: {
    name: string;
    email: string;
    image?: string;
  };
}

interface NavBarTopProps {
  user: UserData;
}

export default function NavBarTop({ user }: NavBarTopProps) {
  const t = useTranslations('Common');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const currentLang = pathname.split('/')[1] as Locale;
  const menuItems = Object.keys(menuOptions).reduce<MenuItem[]>(
    (acc, key) => [
      ...acc,
      ...(
        (menuOptions as unknown as MenuOptions)[key as keyof MenuOptions] || []
      ).map((item) => ({
        ...item,
        path: item.path.startsWith(`/${currentLang}`)
          ? item.path
          : `/${currentLang}${item.path}`,
      })),
    ],
    []
  );
  const title = getNavbarBrand(pathname);
  const translatedTitle = t(`menu.${title}`) || title;
  return (
    <Navbar
      maxWidth='full'
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      isBordered
    >
      <NavbarContent className='sm:hidden' justify='start'>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? 'navbar-close-menu' : 'navbar-open-menu'}
        />
      </NavbarContent>
      <NavbarBrand className='hidden sm:flex'>
        <TitleNavBar title={title} translatedTitle={translatedTitle} />
      </NavbarBrand>
      <NavbarContent className='sm:hidden' justify='center'>
        <NavbarBrand>
          <Avatar src='/logo.png' className='bg-inherint' />
          <p className='pl-1 font-bold uppercase text-inherit'>
            {translatedTitle}
          </p>
        </NavbarBrand>
      </NavbarContent>
      <NavbarContent justify='end'>
        <NavbarItem className='hidden sm:flex'>
          <ThemeSwitcher />
        </NavbarItem>
        <NavbarItem className='hidden sm:flex'>
          <LanguageSwitcher />
        </NavbarItem>
        <NavbarItem className='hidden sm:flex'>
          <UserDropdownMenu user={user} />
        </NavbarItem>
      </NavbarContent>
      <NavbarMenu>
        <NavbarMenuItem key='profile'>
          <User
            name={user.user.name}
            description={user.user.email}
            avatarProps={{
              src: user.user.image || '',
            }}
          />
        </NavbarMenuItem>
        <Divider />
        {menuItems.map((item, index) => {
          const isActive = pathname === item.path;
          return (
            <div key={`${item.key}_${index}`}>
              <NavbarMenuItem key={`${item.key}-${index}`} isActive={isActive}>
                <Link
                  className='w-full'
                  color={isActive ? 'primary' : 'foreground'}
                  href={item.path}
                  size='lg'
                  onPress={() => {
                    if (isActive) setIsMenuOpen(false);
                  }}
                >
                  <LucideIcon name={item.icon} />
                  <span className='ml-3'>{t(item.label)}</span>
                </Link>
              </NavbarMenuItem>
              {item.displayDivider && <Divider />}
            </div>
          );
        })}
        <LanguageSwitcherMobile setIsMenuOpen={setIsMenuOpen} />
        <Divider />
        <ThemeSwitcherMobile setIsMenuOpen={setIsMenuOpen} />
        <Divider />
        <SignOutBtnMobile />
      </NavbarMenu>
    </Navbar>
  );
}
