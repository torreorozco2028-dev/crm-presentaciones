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
};

export const menuOptions = {
  home: [
    {
      key: 'launch',
      label: 'menu.launch',
      path: '/launch',
      icon: 'Rocket',
      displayDivider: true,
    },
    {
      key: 'building',
      label: 'menu.building',
      path: '/buildings',
      icon: 'Building',
      displayDivider: false,
    },
    {
      key: 'general_features',
      label: 'menu.generalFeatures',
      path: '/general_features',
      icon: 'BrickWall',
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
