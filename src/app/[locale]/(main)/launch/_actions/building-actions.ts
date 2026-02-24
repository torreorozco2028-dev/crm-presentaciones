'use server';

import Building from '@/server/db/entities/building';

const entity = new Building();

export async function getBuildings(limit = 10, page = 1, search?: string) {
  try {
    return await entity.getBuildings(limit, page, search);
  } catch (err) {
    console.error(err);
    return [];
  }
}
export async function getTotalBuildings() {
  try {
    return await entity.getTotalBuildings();
  } catch (err) {
    console.error(err);
    return 0;
  }
}
