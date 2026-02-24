'use server';

import Building from '@/server/db/entities/building';

const entity = new Building();

export async function getBuildingById(id: string) {
  try {
    return await entity.getBuildingById(id);
  } catch (err) {
    console.error(err);
    return [];
  }
}
