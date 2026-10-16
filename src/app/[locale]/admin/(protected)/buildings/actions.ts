'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { LANDING_BUILDING_TAG } from '@/server/db/queries/landing';
import BuildingEntity from '@/server/db/entities/building';
import { parseSalesStages } from '@/lib/sales-stages';
import {
  uploadSingleImage,
  uploadBuildingPlan,
  uploadMultipleImages,
  deleteFilesFromStorage,
} from '@/services/storage';

const entity = new BuildingEntity();

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

export async function getBuildingsAction(
  limit: number,
  page: number,
  search?: string
) {
  try {
    return await entity.getBuildings(limit, page, search);
  } catch (error) {
    console.error('Error al obtener edificios:', error);
    throw new Error('No se pudieron cargar los edificios.');
  }
}

/** Textos editables del hero de la landing: titular y precio por m². */
function readHeroFields(formData: FormData) {
  const headline = String(formData.get('hero_headline') ?? '').trim();
  const priceRaw = String(formData.get('price_per_m2') ?? '').trim();
  let price: number | null = null;
  if (priceRaw) {
    price = Number(priceRaw);
    if (!Number.isInteger(price) || price < 0) {
      throw new Error('El precio por m² debe ser un número entero positivo');
    }
  }
  return { hero_headline: headline || null, price_per_m2: price };
}

export async function createBuildingAction(formData: FormData) {
  try {
    const primaryFile = formData.get('primary_image') as File;
    const planFile = formData.get('plan_image') as File;
    const distributionFile = formData.get('distribution_image') as File;
    const extrasPlanFile = formData.get('extras_plan_image') as File | null;
    const batchFiles = formData.getAll('batch_images') as File[];

    const primaryUrl =
      primaryFile.size > 0 ? await uploadSingleImage(primaryFile) : '';
    const planUrl = planFile.size > 0 ? await uploadBuildingPlan(planFile) : '';
    const distributionUrl =
      distributionFile.size > 0
        ? await uploadSingleImage(distributionFile)
        : '';
    const extrasPlanUrl =
      extrasPlanFile && extrasPlanFile.size > 0
        ? await uploadBuildingPlan(extrasPlanFile)
        : null;
    const batchUrls = await uploadMultipleImages(batchFiles);

    const featureIdsString = formData.get('featureIds') as string;
    const featureIds: string[] = featureIdsString
      ? JSON.parse(featureIdsString)
      : [];

    const newBuilding = {
      building_title: formData.get('building_title') as string,
      building_description: formData.get('building_description') as string,
      ...readHeroFields(formData),
      building_location: formData.get('building_location') as string,
      building_locationURL: formData.get('building_locationURL') as string,
      prymary_image: primaryUrl,
      plan_image: planUrl,
      distribution_image: distributionUrl,
      extras_plan_image: extrasPlanUrl,
      total_floors: parseInt(formData.get('total_floors') as string) || 0,
      number_garages: parseInt(formData.get('number_garages') as string) || 0,
      number_storages: parseInt(formData.get('number_storages') as string) || 0,
      batch_images: batchUrls,
    };

    const stages = parseSalesStages(formData);
    const result = await entity.createBuilding(newBuilding, featureIds);
    if (stages) await entity.saveSalesStages(result.id, stages);

    revalidatePath('/admin/buildings');
    revalidateTag(LANDING_BUILDING_TAG);
    revalidatePath('/[locale]', 'page');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error en createBuildingAction:', error);
    return { success: false, error: error.message };
  }
}

export async function updateBuildingAction(id: string, formData: FormData) {
  try {
    const existingBuilding = await entity.getBuildingById(id);
    if (!existingBuilding) throw new Error('Edificio no encontrado');

    const updateData: any = {};
    const filesToDelete: string[] = [];
    const primaryFile = formData.get('primary_image') as File;
    if (primaryFile && primaryFile.size > 0) {
      if (existingBuilding.prymary_image)
        filesToDelete.push(existingBuilding.prymary_image);
      updateData.prymary_image = await uploadSingleImage(primaryFile);
    }
    const planFile = formData.get('plan_image') as File;
    if (planFile && planFile.size > 0) {
      if (existingBuilding.plan_image)
        filesToDelete.push(existingBuilding.plan_image);
      updateData.plan_image = await uploadBuildingPlan(planFile);
    }
    const distributionFile = formData.get('distribution_image') as File;
    if (distributionFile && distributionFile.size > 0) {
      if (existingBuilding.distribution_image)
        filesToDelete.push(existingBuilding.distribution_image);
      updateData.distribution_image = await uploadSingleImage(distributionFile);
    }

    const extrasPlanFile = formData.get('extras_plan_image') as File | null;
    if (extrasPlanFile && extrasPlanFile.size > 0) {
      if (existingBuilding.extras_plan_image)
        filesToDelete.push(existingBuilding.extras_plan_image);
      updateData.extras_plan_image = await uploadBuildingPlan(extrasPlanFile);
    }

    const existingBatchImages = parseBatchImages(existingBuilding.batch_images);
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

    if (hasNewBatchFiles || hasRemovedBatchImages) {
      let nextBatchImages = keptBatchImages;

      if (hasNewBatchFiles) {
        const newUrls = await uploadMultipleImages(newBatchFiles);
        nextBatchImages = [...keptBatchImages, ...newUrls];
      }

      updateData.batch_images = nextBatchImages;
    }

    updateData.building_title = formData.get('building_title') as string;
    updateData.building_description = formData.get(
      'building_description'
    ) as string;
    Object.assign(updateData, readHeroFields(formData));
    updateData.building_location = formData.get('building_location') as string;
    updateData.building_locationURL = formData.get(
      'building_locationURL'
    ) as string;
    updateData.total_floors = parseInt(formData.get('total_floors') as string);
    updateData.number_garages = parseInt(
      formData.get('number_garages') as string
    );
    updateData.number_storages = parseInt(
      formData.get('number_storages') as string
    );

    const featureIdsString = formData.get('featureIds') as string;
    const featureIds = featureIdsString
      ? JSON.parse(featureIdsString)
      : undefined;

    const stages = parseSalesStages(formData);
    const result = await entity.updateBuilding(id, updateData, featureIds);
    if (stages) await entity.saveSalesStages(id, stages);

    if (filesToDelete.length > 0) await deleteFilesFromStorage(filesToDelete);

    revalidatePath('/admin/buildings');
    revalidateTag(LANDING_BUILDING_TAG);
    revalidatePath('/[locale]', 'page');
    return { success: true, data: result.updated };
  } catch (error: any) {
    console.error('Error en updateBuildingAction:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteBuildingAction(id: string) {
  try {
    const buildingToDelete = await entity.getBuildingById(id);
    if (!buildingToDelete) throw new Error('Edificio no existe');

    await entity.deleteBuilding(id);

    const urlsToDelete = [
      buildingToDelete.prymary_image,
      buildingToDelete.plan_image,
      buildingToDelete.distribution_image,
      buildingToDelete.extras_plan_image,
      ...((buildingToDelete.batch_images as string[]) || []),
    ].filter(Boolean) as string[];

    if (urlsToDelete.length > 0) {
      await deleteFilesFromStorage(urlsToDelete);
    }

    revalidatePath('/admin/buildings');
    return { success: true };
  } catch (error: any) {
    console.error('Error en deleteBuildingAction:', error);
    return { success: false, error: error.message };
  }
}
