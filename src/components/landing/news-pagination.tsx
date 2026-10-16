import Link from 'next/link';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getPageWindow, newsPageHref } from '@/lib/news-pagination';

const base =
  'flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition';

export default function NewsPagination({
  locale,
  page,
  totalPages,
}: {
  locale: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label='Paginación de noticias'
      className='mt-14 flex flex-wrap items-center justify-center gap-2'
    >
      {page > 1 && (
        <Link
          href={newsPageHref(locale, page - 1)}
          rel='prev'
          aria-label='Página anterior'
          className={`${base} border border-zinc-300 text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800`}
        >
          <FiChevronLeft />
        </Link>
      )}

      {getPageWindow(page, totalPages).map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} className='px-1 text-zinc-400'>
            …
          </span>
        ) : (
          <Link
            key={item}
            href={newsPageHref(locale, item)}
            aria-current={item === page ? 'page' : undefined}
            className={`${base} ${
              item === page
                ? 'bg-[#0a6406] text-white dark:bg-[#fd8129]'
                : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            {item}
          </Link>
        )
      )}

      {page < totalPages && (
        <Link
          href={newsPageHref(locale, page + 1)}
          rel='next'
          aria-label='Página siguiente'
          className={`${base} border border-zinc-300 text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800`}
        >
          <FiChevronRight />
        </Link>
      )}
    </nav>
  );
}
