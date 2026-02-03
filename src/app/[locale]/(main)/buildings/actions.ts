'use server';

import { revalidatePath } from 'next/cache';
import BuildingEntity from '@/server/db/entities/building';
import { 
  uploadSingleImage, 
  uploadBuildingPlan, 
  uploadMultipleImages, 
  deleteFilesFromStorage 
} from '@/services/storage';

const entity = new BuildingEntity();
export async function getBuildingsAction(limit: number, page: number, search?: string) {
  try {
    return await entity.getBuildings(limit, page, search);
  } catch (error) {
    console.error("Error al obtener edificios:", error);
    throw new Error("No se pudieron cargar los edificios.");
  }
}

export async function createBuildingAction(formData: FormData) {
  try {
    const primaryFile = formData.get('primary_image') as File;
    const planFile = formData.get('plan_image') as File;
    const batchFiles = formData.getAll('batch_images') as File[];

    const primaryUrl = primaryFile.size > 0 ? await uploadSingleImage(primaryFile) : "";
    const planUrl = planFile.size > 0 ? await uploadBuildingPlan(planFile) : "";
    const batchUrls = await uploadMultipleImages(batchFiles);

    const featureIdsString = formData.get('featureIds') as string;
    const featureIds: string[] = featureIdsString ? JSON.parse(featureIdsString) : [];

    const newBuilding = {
      building_title: formData.get('building_title') as string,
      building_description: formData.get('building_description') as string,
      building_location: formData.get('building_location') as string,
      prymary_image: primaryUrl,
      plan_image: planUrl,
      total_floors: parseInt(formData.get('total_floors') as string) || 0,
      number_garages: parseInt(formData.get('number_garages') as string) || 0,
      number_storages: parseInt(formData.get('number_storages') as string) || 0,
      batch_images: batchUrls,
    };

    const result = await entity.createBuilding(newBuilding, featureIds);
    
    revalidatePath('/buildings');
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error en createBuildingAction:", error);
    return { success: false, error: error.message };
  }
}

export async function updateBuildingAction(id: string, formData: FormData) {
  try {
    const existingBuilding = await entity.getBuildingById(id);
    if (!existingBuilding) throw new Error("Edificio no encontrado");

    const updateData: any = {};
    const filesToDelete: string[] = [];
    const primaryFile = formData.get('primary_image') as File;
    if (primaryFile && primaryFile.size > 0) {
      if (existingBuilding.prymary_image) filesToDelete.push(existingBuilding.prymary_image);
      updateData.prymary_image = await uploadSingleImage(primaryFile);
    }
    const planFile = formData.get('plan_image') as File;
    if (planFile && planFile.size > 0) {
      if (existingBuilding.plan_image) filesToDelete.push(existingBuilding.plan_image);
      updateData.plan_image = await uploadBuildingPlan(planFile);
    }

    const newBatchFiles = formData.getAll('batch_images') as File[];
    if (newBatchFiles.length > 0 && newBatchFiles[0].size > 0) {
      const newUrls = await uploadMultipleImages(newBatchFiles);
      updateData.batch_images = newUrls; 
    }

    updateData.building_title = formData.get('building_title') as string;
    updateData.building_description = formData.get('building_description') as string;
    updateData.building_location = formData.get('building_location') as string;
    updateData.total_floors = parseInt(formData.get('total_floors') as string);
    updateData.number_garages = parseInt(formData.get('number_garages') as string);
    updateData.number_storages = parseInt(formData.get('number_storages') as string);

    const featureIdsString = formData.get('featureIds') as string;
    const featureIds = featureIdsString ? JSON.parse(featureIdsString) : undefined;

    const result = await entity.updateBuilding(id, updateData, featureIds);

    if (filesToDelete.length > 0) await deleteFilesFromStorage(filesToDelete);

    revalidatePath('/buildings');
    return { success: true, data: result.updated };
  } catch (error: any) {
    console.error("Error en updateBuildingAction:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteBuildingAction(id: string) {
  try {
    const buildingToDelete = await entity.getBuildingById(id);
    if (!buildingToDelete) throw new Error("Edificio no existe");

    const result = await entity.deleteBuilding(id);

    const urlsToDelete = [
      buildingToDelete.prymary_image,
      buildingToDelete.plan_image,
      ...(buildingToDelete.batch_images as string[] || [])
    ].filter(Boolean) as string[];

    if (urlsToDelete.length > 0) {
      await deleteFilesFromStorage(urlsToDelete);
    }

    revalidatePath('/buildings');
    return { success: true };
  } catch (error: any) {
    console.error("Error en deleteBuildingAction:", error);
    return { success: false, error: error.message };
  }
}