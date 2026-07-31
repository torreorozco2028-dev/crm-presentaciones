'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import BuildingEntity from '@/server/db/entities/building';
import { LANDING_BUILDING_TAG } from '@/server/db/queries/landing';

const entity = new BuildingEntity();

export async function publishLandingChanges(buildingId: string) {
  try {
    await entity.setPublishedBuilding(buildingId);
    revalidateTag(LANDING_BUILDING_TAG);
    revalidatePath('/en');
    revalidatePath('/es');
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: 'No se pudo publicar el edificio' };
  }
}
