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
      path: '/admin/launch',
      icon: 'Rocket',
      displayDivider: true,
      roles: ['user', 'admin'],
    },
    {
      key: 'calculator',
      label: 'menu.calculator',
      path: '/admin/calculator',
      icon: 'Calculator',
      displayDivider: false,
      roles: ['user', 'admin'],
    },
    {
      key: 'building',
      label: 'menu.building',
      path: '/admin/buildings',
      icon: 'Building',
      displayDivider: false,
      roles: ['admin'],
    },
    {
      key: 'pointsofinterest',
      label: 'menu.pointsofinterest',
      path: '/admin/pointsofinterest',
      icon: 'MapPin',
      displayDivider: true,
      roles: ['admin'],
    },
    // {
    //   key: 'generalfeatures',
    //   label: 'menu.generalfeatures',
    //   path: '/generalfeatures',
    //   icon: 'BrickWall',
    //   displayDivider: false,
    //   roles: ['admin'],
    // },
    {
      key: 'departments',
      label: 'menu.departments',
      path: '/admin/departments',
      icon: 'Building2',
      displayDivider: false,
      roles: ['admin'],
    },
    {
      key: 'commonareas',
      label: 'menu.commonareas',
      path: '/admin/commonareas',
      icon: 'LayoutGrid',
      displayDivider: false,
      roles: ['admin'],
    },
    {
      key: 'departmentfeatures',
      label: 'menu.departmentfeatures',
      path: '/admin/departmentfeatures',
      icon: 'Layers',
      displayDivider: true,
      roles: ['admin'],
    },
    {
      key: 'users',
      label: 'menu.users',
      path: '/admin/users',
      icon: 'Users',
      displayDivider: true,
      roles: ['admin'],
    },
    {
      key: 'clients',
      label: 'menu.clients',
      path: '/admin/clients',
      icon: 'ContactRound',
      displayDivider: false,
      roles: ['user', 'admin'],
    },
    {
      key: 'sales',
      label: 'menu.sales',
      path: '/admin/sales',
      icon: 'Store',
      displayDivider: true,
      roles: ['user', 'admin'],
    },
  ],
};
