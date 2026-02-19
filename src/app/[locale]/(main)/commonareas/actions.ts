'use server';

import { revalidatePath } from 'next/cache';
import CommonAreasEntity from '@/server/db/entities/commonareas';
import {
  uploadMultipleImages,
  deleteFilesFromStorage,
} from '@/services/storage';

const entity = new CommonAreasEntity();

export async function getCommonAreasByBuildingAction(buildingId: string) {
  try {
    return await entity.getCommonAreasByBuilding(buildingId);
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Error al cargar areas comunes.');
  }
}

export async function createCommonAreaAction(formData: FormData) {
  try {
    const batchFiles = formData.getAll('batch_images') as File[];
    const batchUrls =
      batchFiles.length > 0 && batchFiles[0].size > 0
        ? await uploadMultipleImages(batchFiles)
        : [];

    const newArea = {
      buildingId: formData.get('buildingId') as string,
      common_area_name: formData.get('common_area_name') as string,
      common_area_description: formData.get(
        'common_area_description'
      ) as string,
      batch_images: JSON.stringify(batchUrls),
    };

    const result = await entity.createCommonArea(newArea);

    revalidatePath('/common-areas');
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCommonAreaAction(id: string) {
  try {
    const area = await entity.getCommonAreaById(id);
    if (!area) throw new Error('Área no encontrada');

    await entity.deleteCommonArea(id);

    const images = area.batch_images
      ? JSON.parse(area.batch_images as string)
      : [];
    if (images.length > 0) {
      await deleteFilesFromStorage(images);
    }

    revalidatePath('/common-areas');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
