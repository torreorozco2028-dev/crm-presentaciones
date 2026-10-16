import type { Metadata } from 'next';
import NewsPageView, {
  generateNewsMetadata,
} from '@/components/landing/news-page-view';

export const revalidate = 3600;

type Params = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateNewsMetadata(locale, 1);
}

export default async function NoticiasPage({ params }: { params: Params }) {
  const { locale } = await params;
  return <NewsPageView locale={locale} page={1} />;
}
