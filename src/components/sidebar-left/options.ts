'use client';

import { icons } from 'lucide-react';

type IconName = keyof typeof icons;

export type MenuItem = {
  key: string;
  label: string;
  path: string;
  icon: IconName;
  displayDivider: boolean;
};

export type MenuOptions = {
  home: MenuItem[];
  planning: MenuItem[];
  inventory: MenuItem[];
  accounting: MenuItem[];
  admin: MenuItem[];
};

export const menuOptions = {
  home: [
    {
      key: 'dashboard',
      label: 'menu.dashboard',
      path: '/dashboard',
      icon: 'LayoutDashboard',
      displayDivider: true,
    },
  ],
  planning: [
    {
      key: 'projects',
      label: 'menu.projects',
      path: '/projects',
      icon: 'CopyCheck',
      displayDivider: true,
    },
    {
      key: 'unit-costs',
      label: 'menu.unitCosts',
      path: '/unit-costs',
      icon: 'Boxes',
      displayDivider: true,
    },
    {
      key: 'unit-prices',
      label: 'menu.unit-prices',
      path: '/unit-prices',
      icon: 'Receipt',
      displayDivider: true,
    },
  ],
  inventory: [
    {
      key: 'providers',
      label: 'menu.providers',
      path: '/inventory/providers',
      icon: 'Box',
      displayDivider: false,
    },
    {
      key: 'warehouse',
      label: 'menu.warehouse',
      path: '/inventory/warehouse',
      icon: 'Warehouse',
      displayDivider: false,
    },
    {
      key: 'renting',
      label: 'menu.renting',
      path: '/inventory/renting',
      icon: 'Banknote',
      displayDivider: true,
    },
  ],
  accounting: [
    {
      key: 'accounting',
      label: 'menu.accounts',
      path: '/accounting/accounts',
      icon: 'FileUser',
      displayDivider: false,
    },
    {
      key: 'daily-book',
      label: 'menu.dailyBook',
      path: '/accounting/daily-book',
      icon: 'BookOpenText',
      displayDivider: false,
    },
    {
      key: 'ledger-book',
      label: 'menu.ledgerBook',
      path: '/accounting/ledger-book',
      icon: 'BookOpen',
      displayDivider: true,
    },
  ],
  admin: [
    {
      key: 'users',
      label: 'menu.users',
      path: '/users',
      icon: 'Users',
      displayDivider: true,
    },
  ],
};
