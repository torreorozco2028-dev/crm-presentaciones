export const NEWS_PAGE_SIZE = 10;
export const NEWS_ADMIN_PAGE_SIZE = 10;
const MAX_PAGE = 1000;

/** Numero de pagina valido (entero entre 1 y MAX_PAGE) o null. */
export function parsePageParam(raw: unknown): number | null {
  if (typeof raw !== 'string' || !/^\d{1,4}$/.test(raw)) return null;
  const page = Number(raw);
  return page >= 1 && page <= MAX_PAGE ? page : null;
}

export function totalPagesFor(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function newsPageHref(locale: string, page: number) {
  return page <= 1
    ? `/${locale}/noticias`
    : `/${locale}/noticias/pagina/${page}`;
}

/** Paginas a mostrar: primera, ultima y la actual con sus vecinas. */
export function getPageWindow(
  current: number,
  total: number
): (number | 'gap')[] {
  const pages = new Set(
    [1, total, current - 1, current, current + 1].filter(
      (p) => p >= 1 && p <= total
    )
  );
  const sorted = [...pages].sort((a, b) => a - b);

  return sorted.flatMap((p, i) =>
    i > 0 && p - sorted[i - 1] > 1 ? (['gap', p] as const) : [p]
  );
}
