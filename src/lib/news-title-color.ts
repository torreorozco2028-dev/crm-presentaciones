/**
 * Colores de titulo permitidos para una noticia. Cada uno trae clases para modo
 * claro y oscuro (estaticas, para que Tailwind las detecte) y un valor de muestra.
 */
export const NEWS_TITLE_COLORS = {
  green: {
    label: 'Verde',
    className: 'text-[#0a6406] dark:text-[#4ade80]',
    swatch: '#0a6406',
  },
  orange: {
    label: 'Naranja',
    className: 'text-[#c2570a] dark:text-[#fd8129]',
    swatch: '#fd8129',
  },
  blue: {
    label: 'Azul',
    className: 'text-blue-700 dark:text-blue-400',
    swatch: '#1d4ed8',
  },
  red: {
    label: 'Rojo',
    className: 'text-red-700 dark:text-red-400',
    swatch: '#b91c1c',
  },
  purple: {
    label: 'Violeta',
    className: 'text-purple-700 dark:text-purple-400',
    swatch: '#7e22ce',
  },
} as const;

export type NewsTitleColor = keyof typeof NEWS_TITLE_COLORS;

const DEFAULT_TITLE_CLASS = 'text-zinc-900 dark:text-white';

export function parseNewsTitleColor(value: unknown): NewsTitleColor | null {
  return typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(NEWS_TITLE_COLORS, value)
    ? (value as NewsTitleColor)
    : null;
}

export function newsTitleClass(value: unknown): string {
  const key = parseNewsTitleColor(value);
  return key ? NEWS_TITLE_COLORS[key].className : DEFAULT_TITLE_CLASS;
}
