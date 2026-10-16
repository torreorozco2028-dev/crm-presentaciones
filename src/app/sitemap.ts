import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { routing } from '@/i18n/routing';

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) => [
    {
      url: `${siteConfig.url}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${siteConfig.url}/${locale}/noticias`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ]);
}
