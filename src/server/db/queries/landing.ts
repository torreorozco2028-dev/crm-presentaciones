import { unstable_cache } from 'next/cache';
import BuildingEntity from '@/server/db/entities/building';
import { NEWS_PAGE_SIZE } from '@/lib/news-pagination';
import BuildingNewsEntity from '@/server/db/entities/building-news';

export const LANDING_BUILDING_TAG = 'landing-building';

const buildingEntity = new BuildingEntity();

export const getPublishedBuildingData = unstable_cache(
  async () => {
    const publishedId = await buildingEntity.getPublishedBuildingId();
    if (!publishedId) return null;
    return buildingEntity.getBuildingById(publishedId);
  },
  ['landing-building-data'],
  { tags: [LANDING_BUILDING_TAG], revalidate: 3600 }
);

export const LANDING_NEWS_TAG = 'landing-news';

const newsEntity = new BuildingNewsEntity();

export const getPublishedNewsPage = unstable_cache(
  async (page: number) => {
    const publishedId = await buildingEntity.getPublishedBuildingId();
    if (!publishedId) return { items: [], total: 0, latestProgress: null };
    return newsEntity.getPublishedNewsPage(
      publishedId,
      NEWS_PAGE_SIZE,
      (page - 1) * NEWS_PAGE_SIZE
    );
  },
  ['landing-news-page'],
  { tags: [LANDING_NEWS_TAG], revalidate: 3600 }
);
