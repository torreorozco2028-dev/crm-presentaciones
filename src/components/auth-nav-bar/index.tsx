'use client';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Avatar,
} from '@heroui/react';
import { ThemeSwitcher } from '../theme-switcher';

export default function AuthNavBar() {
  return (
    <Navbar maxWidth='full'>
      <NavbarBrand>
        <Avatar src='/logo.png' className='bg-inherint' />
        <p className='font-bold text-inherit'>STRUCTEC S.R.L</p>
      </NavbarBrand>
      <NavbarContent justify='end'>
        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
