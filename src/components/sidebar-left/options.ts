'use client';

import { icons } from 'lucide-react';

type IconName = keyof typeof icons;

export type MenuItem = {
  key: string;
  label: string;
  path: string;
  icon: IconName;
  displayDivider: boolean;
  roles: string[];
};

export type MenuOptions = {
  home: MenuItem[];
};

export const menuOptions = {
  home: [
    {
      key: 'launch',
      label: 'menu.launch',
      path: '/launch',
      icon: 'Rocket',
      displayDivider: true,
      roles: ['user', 'admin'],
    },
    {
      key: 'calculator',
      label: 'menu.calculator',
      path: '/calculator',
      icon: 'Calculator',
      displayDivider: false,
      roles: ['user', 'admin'],
    },
    {
      key: 'building',
      label: 'menu.building',
      path: '/buildings',
      icon: 'Building',
      displayDivider: false,
      roles: ['admin'],
    },
    {
      key: 'pointsofinterest',
      label: 'menu.pointsofinterest',
      path: '/pointsofinterest',
      icon: 'MapPin',
      displayDivider: true,
      roles: ['admin'],
    },
    {
      key: 'generalfeatures',
      label: 'menu.generalfeatures',
      path: '/generalfeatures',
      icon: 'BrickWall',
      displayDivider: false,
      roles: ['admin'],
    },
    {
      key: 'departments',
      label: 'menu.departments',
      path: '/departments',
      icon: 'Building2',
      displayDivider: false,
      roles: ['admin'],
    },
    {
      key: 'commonareas',
      label: 'menu.commonareas',
      path: '/commonareas',
      icon: 'LayoutGrid',
      displayDivider: false,
      roles: ['admin'],
    },
    {
      key: 'departmentfeatures',
      label: 'menu.departmentfeatures',
      path: '/departmentfeatures',
      icon: 'Layers',
      displayDivider: true,
      roles: ['admin'],
    },
    {
      key: 'users',
      label: 'menu.users',
      path: '/users',
      icon: 'Users',
      displayDivider: true,
      roles: ['admin'],
    },
    {
      key: 'clients',
      label: 'menu.clients',
      path: '/clients',
      icon: 'ContactRound',
      displayDivider: false,
      roles: ['user', 'admin'],
    },
    {
      key: 'sales',
      label: 'menu.sales',
      path: '/sales',
      icon: 'Store',
      displayDivider: true,
      roles: ['user', 'admin'],
    },
  ],
};
