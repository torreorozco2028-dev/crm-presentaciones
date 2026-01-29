import type { ClassValue } from 'clsx';

import clsx from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const COMMON_UNITS = ['small', 'medium', 'large'];

/**
 * We need to extend the tailwind merge to include NextUI's custom classes.
 *
 * So we can use classes like `text-small` or `text-default-500` and override them.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: ['divider'],
    },
    classGroups: {
      shadow: [{ shadow: COMMON_UNITS }],
      'font-size': [{ text: ['tiny', ...COMMON_UNITS] }],
      'bg-image': ['bg-stripe-gradient'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormat = (num: number) =>
  Number(num).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export { currencyFormat };

export function createSlugText(str: string) {
  if (str) return str.toLowerCase().replace(' ', '-');
  return '';
}

export function isUUID(str: string) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function verifyTitle(str: string) {
  if (isUUID(str)) return '';
  return str;
}

export function toCamelCase(str: string) {
  return str
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}
