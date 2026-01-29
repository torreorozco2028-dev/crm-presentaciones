'use client';

import { icons } from 'lucide-react';

type IconName = keyof typeof icons;

type LucideConfigType = {
  name: IconName;
  color?: string;
  size?: string;
};

const LucideIcon = ({ name, color, size }: LucideConfigType) => {
  const LucideIcon = icons[name];

  if (!LucideIcon) {
    return null;
  }

  return <LucideIcon color={color} size={size} strokeWidth={2} />;
};

export default LucideIcon;
