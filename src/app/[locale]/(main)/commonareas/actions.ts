'use server';

import { revalidatePath } from 'next/cache';
import CommonAreasEntity from '@/server/db/entities/commonareas';
import {
  uploadMultipleImages,
  deleteFilesFromStorage,
} from '@/services/storage';

const entity = new CommonAreasEntity();

function parseBatchImages(batchImages: unknown): string[] {
  if (!batchImages) return [];
  if (Array.isArray(batchImages)) {
    return batchImages.filter((img): img is string => typeof img === 'string');
  }
  if (typeof batchImages === 'string') {
    try {
      const parsed = JSON.parse(batchImages);
      return Array.isArray(parsed)
        ? parsed.filter((img): img is string => typeof img === 'string')
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

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

export async function updateCommonAreaAction(id: string, formData: FormData) {
  try {
    const existing = await entity.getCommonAreaById(id);
    if (!existing) throw new Error('Área no encontrada');

    const updateData: any = {
      common_area_name: formData.get('common_area_name') as string,
      common_area_description: formData.get(
        'common_area_description'
      ) as string,
    };

    const existingImages = parseBatchImages(existing.batch_images);
    const removedImagesRaw = formData.get('removed_batch_images') as string;
    const removedImages = removedImagesRaw
      ? parseBatchImages(removedImagesRaw)
      : [];
    const orderedExistingRaw = formData.get(
      'ordered_existing_batch_images'
    ) as string;
    const orderedExisting = orderedExistingRaw
      ? parseBatchImages(orderedExistingRaw)
      : existingImages;

    const keptImages = orderedExisting.filter(
      (img) => !removedImages.includes(img)
    );
    const filesToDelete = [...removedImages];

    const newBatchFiles = formData.getAll('batch_images') as File[];
    const hasNewFiles = newBatchFiles.length > 0 && newBatchFiles[0].size > 0;

    if (hasNewFiles || removedImages.length > 0) {
      let nextImages = keptImages;
      if (hasNewFiles) {
        const newUrls = await uploadMultipleImages(newBatchFiles);
        nextImages = [...keptImages, ...newUrls];
      }
      updateData.batch_images = JSON.stringify(nextImages);
    }

    if (filesToDelete.length > 0) {
      await deleteFilesFromStorage(filesToDelete);
    }

    const result = await entity.updateCommonArea(id, updateData);

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

    const images = parseBatchImages(area.batch_images);
    if (images.length > 0) {
      await deleteFilesFromStorage(images);
    }

    revalidatePath('/common-areas');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
