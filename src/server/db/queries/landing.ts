import { unstable_cache } from 'next/cache';
import BuildingEntity from '@/server/db/entities/building';

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
