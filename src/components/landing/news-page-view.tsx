import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import {
  getPublishedBuildingData,
  getPublishedNewsPage,
} from '@/server/db/queries/landing';
import { siteConfig } from '@/config/site';
import {
  NEWS_PAGE_SIZE,
  newsPageHref,
  totalPagesFor,
} from '@/lib/news-pagination';
import NewsSection from '@/components/landing/news-section';
import LandingFooter from '@/components/landing/landing-footer';
import CreativeNavbar from '@/components/component-navbar/CreativeNavbar';

export async function generateNewsMetadata(
  locale: string,
  page: number
): Promise<Metadata> {
  const building = await getPublishedBuildingData();
  const name = building?.building_title;

  const title = `Avance de obra${name ? ` | ${name}` : ''}${page > 1 ? ` (página ${page})` : ''}`;
  const description = `Sigue el avance de la obra${
    name ? ` de ${name}` : ''
  } con fotos y videos actualizados.`;
  const url = `${siteConfig.url}${newsPageHref(locale, page)}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${siteConfig.url}${newsPageHref('en', page)}`,
        es: `${siteConfig.url}${newsPageHref('es', page)}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images: building?.prymary_image
        ? [{ url: building.prymary_image }]
        : undefined,
      locale,
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

// Vista estatica: no leer cookies ni headers aqui (ej. auth()), o deja de serlo.
export default async function NewsPageView({
  locale,
  page,
}: {
  locale: string;
  page: number;
}) {
  setRequestLocale(locale);
  const { items, total, latestProgress } = await getPublishedNewsPage(page);
  const totalPages = totalPagesFor(total, NEWS_PAGE_SIZE);

  if (page > totalPages) notFound();

  return (
    <div className='min-h-screen'>
      <header>
        <CreativeNavbar />
      </header>
      <NewsSection
        news={items}
        latestProgress={latestProgress}
        locale={locale}
        page={page}
        totalPages={totalPages}
      />
      <LandingFooter />
    </div>
  );
}
