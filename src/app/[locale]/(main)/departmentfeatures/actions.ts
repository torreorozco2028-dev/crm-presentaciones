'use server';

import { revalidatePath } from 'next/cache';
import DepartmentEntity from '@/server/db/entities/department';

const entity = new DepartmentEntity();

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

    if (!featureName) {
      throw new Error('El nombre de la feature es requerido.');
    }

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
