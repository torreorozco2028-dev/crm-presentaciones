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
      displayDivider: true,
      roles: ['admin'],
    },
  ],
  admin: [
    {
      key: 'users',
      label: 'menu.users',
      path: '/users',
      icon: 'Users',
      displayDivider: true,
      roles: ['admin'],
    },
  ],
};
