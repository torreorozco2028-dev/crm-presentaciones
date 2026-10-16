import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import NewsPageView, {
  generateNewsMetadata,
} from '@/components/landing/news-page-view';
import { newsPageHref, parsePageParam } from '@/lib/news-pagination';

export const revalidate = 3600;

// Sin paginas pre-generadas: se crean en la primera visita y quedan en cache,
// asi el build no depende de la base de datos.
export function generateStaticParams() {
  return [];
}

type Params = Promise<{ locale: string; page: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, page: rawPage } = await params;
  const page = parsePageParam(rawPage);
  return page ? generateNewsMetadata(locale, page) : {};
}

export default async function NoticiasPaginaPage({
  params,
}: {
  params: Params;
}) {
  const { locale, page: rawPage } = await params;
  const page = parsePageParam(rawPage);
  if (!page) notFound();
  if (page === 1) permanentRedirect(newsPageHref(locale, 1));

  return <NewsPageView locale={locale} page={page} />;
}
