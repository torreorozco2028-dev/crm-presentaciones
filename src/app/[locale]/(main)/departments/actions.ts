'use server';

import { revalidatePath } from 'next/cache';
import DepartmentEntity from '@/server/db/entities/department';
import {
  uploadSingleImage,
  uploadMultipleImages,
  deleteFilesFromStorage,
} from '@/services/storage';

const entity = new DepartmentEntity();

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

// ===== DEPARTMENT MODELS =====

export async function getModelsByBuildingAction(buildingId: string) {
  try {
    return await entity.getModelsByBuilding(buildingId);
  } catch (error) {
    console.error('Error al obtener modelos de departamentos:', error);
    throw new Error('No se pudieron cargar los modelos de departamentos.');
  }
}

export async function createDepartmentModelAction(formData: FormData) {
  try {
    const buildingId = formData.get('buildingId') as string;
    const name = formData.get('name_model_department') as string;
    const baseSquareMeters =
      parseInt(formData.get('base_square_meters') as string) || 0;
    const balcony = formData.get('balcony') === 'true';
    const idPlan = formData.get('id_plan') as string;

    const primaryFile = formData.get('primary_image') as File;
    const batchFiles = formData.getAll('batch_images') as File[];

    const primaryUrl =
      primaryFile && primaryFile.size > 0
        ? await uploadSingleImage(primaryFile)
        : '';
    const batchUrls =
      batchFiles.length > 0 && batchFiles[0].size > 0
        ? await uploadMultipleImages(batchFiles)
        : [];

    const featureIdsString = formData.get('featureIds') as string;
    const featureIds: string[] = featureIdsString
      ? JSON.parse(featureIdsString)
      : [];

    const newModel = {
      buildingId,
      name_model_department: name,
      base_square_meters: baseSquareMeters,
      balcony,
      id_plan: idPlan,
      prymary_image: primaryUrl,
      batch_images: JSON.stringify(batchUrls),
    };

    const result = await entity.createModel(newModel as any, featureIds);

    revalidatePath('/departments');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error en createDepartmentModelAction:', error);
    return { success: false, error: error.message };
  }
}

export async function updateDepartmentModelAction(
  id: string,
  formData: FormData
) {
  try {
    const existingModel = await entity.getModelById(id);

    if (!existingModel) throw new Error('Modelo de departamento no encontrado');

    const updateData: any = {};
    const filesToDelete: string[] = [];

    updateData.name_model_department = formData.get(
      'name_model_department'
    ) as string;
    updateData.base_square_meters =
      parseInt(formData.get('base_square_meters') as string) || 0;
    updateData.balcony = formData.get('balcony') === 'true';
    updateData.id_plan = formData.get('id_plan') as string;

    const removePrimaryImage = formData.get('remove_primary_image') === 'true';
    if (removePrimaryImage && existingModel.prymary_image) {
      filesToDelete.push(existingModel.prymary_image);
      updateData.prymary_image = '';
    }

    const primaryFile = formData.get('primary_image') as File;
    if (primaryFile && primaryFile.size > 0) {
      if (existingModel.prymary_image)
        filesToDelete.push(existingModel.prymary_image);
      updateData.prymary_image = await uploadSingleImage(primaryFile);
    }

    const existingBatchImages = parseBatchImages(existingModel.batch_images);
    const orderedExistingBatchImagesRaw = formData.get(
      'ordered_existing_batch_images'
    ) as string;
    const orderedExistingBatchImages = orderedExistingBatchImagesRaw
      ? parseBatchImages(orderedExistingBatchImagesRaw)
      : existingBatchImages;

    const removedBatchImagesRaw = formData.get(
      'removed_batch_images'
    ) as string;
    const removedBatchImages = removedBatchImagesRaw
      ? parseBatchImages(removedBatchImagesRaw)
      : [];

    const keptBatchImages = orderedExistingBatchImages.filter(
      (img) => !removedBatchImages.includes(img)
    );
    filesToDelete.push(...removedBatchImages);

    const newBatchFiles = formData.getAll('batch_images') as File[];
    const hasNewBatchFiles =
      newBatchFiles.length > 0 && newBatchFiles[0].size > 0;
    const hasRemovedBatchImages = removedBatchImages.length > 0;
    const hasReorderedBatchImages =
      orderedExistingBatchImages.length === existingBatchImages.length &&
      orderedExistingBatchImages.some(
        (img, index) => img !== existingBatchImages[index]
      );

    if (hasNewBatchFiles || hasRemovedBatchImages || hasReorderedBatchImages) {
      let nextBatchImages = keptBatchImages;

      if (hasNewBatchFiles) {
        const newUrls = await uploadMultipleImages(newBatchFiles);
        nextBatchImages = [...keptBatchImages, ...newUrls];
      }

      updateData.batch_images = JSON.stringify(nextBatchImages);
    }

    if (filesToDelete.length > 0) {
      await deleteFilesFromStorage(filesToDelete);
    }

    const featureIdsString = formData.get('featureIds') as string;
    const featureIds: string[] = featureIdsString
      ? JSON.parse(featureIdsString)
      : undefined;

    const result = await entity.updateModel(id, updateData, featureIds);

    revalidatePath('/departments');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error en updateDepartmentModelAction:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDepartmentModelAction(id: string) {
  try {
    const result = await entity.deleteModel(id);
    revalidatePath('/departments');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error en deleteDepartmentModelAction:', error);
    return { success: false, error: error.message };
  }
}

// ===== DEPARTMENT UNITS =====

export async function getUnitsByModelAction(modelId: string) {
  try {
    return await entity.getUnitsByModel(modelId);
  } catch (error) {
    console.error('Error al obtener unidades:', error);
    throw new Error('No se pudieron cargar las unidades.');
  }
}

export async function createDepartmentUnitAction(formData: FormData) {
  try {
    const buildingId = formData.get('buildingId') as string;
    const modelId = formData.get('modelId') as string;
    const unitNumber = formData.get('unit_number') as string;
    const floor = parseInt(formData.get('floor') as string) || 0;
    const realSquareMeters =
      parseFloat(formData.get('real_square_meters') as string) || 0;
    const state = parseInt(formData.get('state') as string) || 1;

    const newUnit = {
      buildingId,
      modelId,
      unit_number: unitNumber,
      floor,
      real_square_meters: realSquareMeters,
      state,
    };

    const result = await entity.createUnit(newUnit as any);
    revalidatePath('/departments');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error en createDepartmentUnitAction:', error);
    return { success: false, error: error.message };
  }
}

export async function updateDepartmentUnitAction(
  id: string,
  formData: FormData
) {
  try {
    const updateData: any = {
      unit_number: formData.get('unit_number') as string,
      floor: parseInt(formData.get('floor') as string) || 0,
      real_square_meters:
        parseFloat(formData.get('real_square_meters') as string) || 0,
      state: parseInt(formData.get('state') as string) || 1,
    };

    const result = await entity.updateUnit(id, updateData);
    revalidatePath('/departments');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error en updateDepartmentUnitAction:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDepartmentUnitAction(id: string) {
  try {
    const result = await entity.deleteUnit(id);
    revalidatePath('/departments');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error en deleteDepartmentUnitAction:', error);
    return { success: false, error: error.message };
  }
}

// ===== DEPARTMENT FEATURES =====

export async function getAllDepartmentFeaturesAction() {
  try {
    return await entity.getAllFeatures();
  } catch (error) {
    console.error('Error al obtener features de departamentos:', error);
    throw new Error('No se pudieron cargar las features.');
  }
}

export async function createDepartmentFeatureAction(formData: FormData) {
  try {
    const featureName = formData.get('dfeatures_name') as string;
    const room = formData.get('room') as string;
    const order = parseInt(formData.get('order') as string) || 0;

    const newFeature = {
      dfeatures_name: featureName,
      room: room || null,
      order,
    };

    const result = await entity.createFeature(newFeature as any);
    revalidatePath('/departmentfeatures');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error en createDepartmentFeatureAction:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDepartmentFeatureAction(id: string) {
  try {
    const result = await entity.deleteFeature(id);
    revalidatePath('/departmentfeatures');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error en deleteDepartmentFeatureAction:', error);
    return { success: false, error: error.message };
  }
}
