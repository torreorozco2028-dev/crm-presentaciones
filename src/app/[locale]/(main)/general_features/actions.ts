'use server';

import { revalidatePath } from 'next/cache';
import BuildingEntity from '@/server/db/entities/building';

const entity = new BuildingEntity();

export async function getAllFeaturesAction() {
  try {
    return await entity.getAllFeatures();
  } catch (error) {
    console.error('Error fetching features:', error);
    return [];
  }
}

export async function createFeatureAction(name: string, room?: string) {
  try {
    await entity.createFeature({
      name_gfeatures: name,
      room: room || null,
    });
    revalidatePath('/general-features');
    return { success: true };
  } catch (error) {
    console.error('Error creating feature:', error);
    return { success: false, error: 'Error al crear la caracteristica' };
  }
}

export async function updateFeatureAction(
  id: string,
  data: { name_gfeatures?: string; room?: string }
) {
  try {
    await entity.updateFeature(id, data);
    revalidatePath('/general-features');
    return { success: true };
  } catch (error) {
    console.error('Error updating feature:', error);
    return { success: false };
  }
}

export async function deleteFeatureAction(id: string) {
  try {
    await entity.deleteFeature(id);
    revalidatePath('/general-features');
    return { success: true };
  } catch (error) {
    console.error('Error deleting feature:', error);
    return { success: false };
  }
}
