'use server';
import { put, del } from '@vercel/blob';

async function uploadToBlob(file: File, allowedTypes: string[]): Promise<string> {
  if (!file || file.size === 0) throw new Error('El archivo esta vacio');

  const isTypeAllowed = allowedTypes.some((type) =>
    type.includes('*') 
      ? file.type.startsWith(type.replace('*', '')) 
      : file.type === type
  );

  if (!isTypeAllowed) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}. Se esperaba: ${allowedTypes.join(', ')}`);
  }

  const blob = await put(file.name, file, {
    access: 'public',
    contentType: file.type,
  });

  if (!blob?.url) throw new Error('Error al subir a Vercel Blob');
  return blob.url;
}

export async function uploadSingleImage(file: File): Promise<string> {
  return await uploadToBlob(file, ['image/*']);
}

export async function uploadBuildingPlan(file: File): Promise<string> {
  return await uploadToBlob(file, ['image/svg+xml']);
}

export async function uploadMultipleImages(files: File[]): Promise<string[]> {
  if (!files.length) return [];
  const validFiles = files.filter(f => f.size > 0);
  const uploadPromises = validFiles.map((file) => uploadToBlob(file, ['image/*']));

  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error en uploadMultipleImages:', error);
    throw new Error('Error al subir una o mas imagenes');
  }
}


export async function deleteFilesFromStorage(urls: string | string[]): Promise<void> {
  const urlArray = Array.isArray(urls) ? urls : [urls];
  const activeUrls = urlArray.filter(url => url && url.trim() !== "");

  if (activeUrls.length === 0) return;

  try {
    await del(activeUrls);
  } catch (error) {
    console.error('Error al eliminar archivos de storage:', error);
  }
}