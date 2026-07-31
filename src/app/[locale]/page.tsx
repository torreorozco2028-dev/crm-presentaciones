import type { Metadata } from 'next';
import { getPublishedBuildingData } from '@/server/db/queries/landing';
import { siteConfig } from '@/config/site';
import { auth } from '@/auth';
import BuildingHero from '@/app/[locale]/presentations/[buildingId]/building/first-part';
import PresentationView from '@/components/presentation/presentation-view';
import BenefitsSection from '@/components/landing/benefits-section';
import CTASection from '@/components/landing/cta-section';
import LandingFooter from '@/components/landing/landing-footer';
import EmptyLanding from '@/components/landing/empty-landing';
import CreativeNavbar from '@/components/component-navbar/CreativeNavbar';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const building = await getPublishedBuildingData();

  const title = building?.building_title || siteConfig.name;
  const description = building?.building_description || siteConfig.description;
  const image = building?.prymary_image;
  const url = `${siteConfig.url}/${locale}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${siteConfig.url}/en`,
        es: `${siteConfig.url}/es`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images: image ? [{ url: image }] : undefined,
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [building, session] = await Promise.all([
    getPublishedBuildingData(),
    auth(),
  ]);

  if (!building) {
    return <EmptyLanding />;
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: building.building_title,
    description: building.building_description ?? undefined,
    image: building.prymary_image ?? undefined,
    url: `${siteConfig.url}/${locale}`,
    brand: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
  };

  return (
    <div className='min-h-screen'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header>
        <CreativeNavbar session={session} />
      </header>
      <BuildingHero building={building} />
      <BenefitsSection features={building.buildingToFeatures as any} />
      <PresentationView building={building} isAuthenticated={!!session} />
      <CTASection buildingTitle={building.building_title} />
      <LandingFooter />
    </div>
  );
}
