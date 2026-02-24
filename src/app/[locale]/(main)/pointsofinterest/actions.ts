'use server';

import { revalidatePath } from 'next/cache';
import PointsOfInterestEntity from '@/server/db/entities/pointsofinterest';

const entity = new PointsOfInterestEntity();

export async function getPointsByBuildingAction(buildingId: string) {
  try {
    return await entity.getPointsByBuilding(buildingId);
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Error al cargar puntos de interes');
  }
}

export async function createPointOfInterestAction(formData: FormData) {
  try {
    const newPoint = {
      buildingId: formData.get('buildingId') as string,
      point_name: formData.get('point_name') as string,
      point_description: formData.get('point_description') as string,
      point_distance: parseInt(formData.get('point_distance') as string) || 0,
      lat: formData.get('lat') as string,
      lon: formData.get('lon') as string,
    };

    const result = await entity.createPointOfInterest(newPoint);

    revalidatePath('/points-of-interest');
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePointOfInterestAction(id: string) {
  try {
    await entity.deletePointOfInterest(id);
    revalidatePath('/points-of-interest');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
