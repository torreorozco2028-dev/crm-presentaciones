'use server';

import DepartmentEntity from '@/server/db/entities/department';
import BuildingEntity from '@/server/db/entities/building';

export async function getDepartmentsByBuilding(buildingId: string) {
  const entity = new DepartmentEntity();
  return await entity.getModelsByBuilding(buildingId);
}

export async function getBuildingInfo(buildingId: string) {
  const entity = new BuildingEntity();
  return await entity.getBuildingById(buildingId);
}