'use client';

import { icons } from 'lucide-react';

type IconName = keyof typeof icons;

type LucideConfigType = {
  name?: IconName;
  icon?: IconName;
  color?: string;
  size?: number | string;
};

const LucideIcon = ({ name, icon, color, size }: LucideConfigType) => {
  const iconName = name ?? icon;

  if (!iconName) {
    return null;
  }

  const LucideIconComponent = icons[iconName];

  if (!LucideIconComponent) {
    return null;
  }

  return <LucideIconComponent color={color} size={size} strokeWidth={2} />;
};

export default LucideIcon;
