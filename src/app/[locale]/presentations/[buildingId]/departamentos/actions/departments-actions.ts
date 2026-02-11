'use server';

import DepartmentEntity from '@/server/db/entities/department';
import Building from '@/server/db/entities/building';

const departmentEntity = new DepartmentEntity();
const buildingEntity = new Building();

export async function getDepartmentsByBuilding(buildingId: string) {
  try {
    return await departmentEntity.getModelsByBuilding(buildingId);
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function getBuildingInfo(buildingId: string) {
  try {
    return await buildingEntity.getBuildingById(buildingId);
  } catch (err) {
    console.error(err);
    return null;
  }
}
