'use server';

import { put, del } from '@vercel/blob';

async function uploadToBlob(file: File): Promise<string> {
  if (!file || file.size === 0) throw new Error('File is empty');
  if (!file.type.startsWith('image/'))
    throw new Error(`Invalid file type: ${file.type}`);

  const blob = await put(file.name, file, {
    access: 'public',
    contentType: file.type,
  });

  if (!blob?.url) throw new Error('Failed to upload to Vercel Blob');
  return blob.url;
}

export async function uploadMultipleImages(
  formData: FormData
): Promise<string[]> {
  const imageFiles = formData.getAll('upload') as File[];
  if (!imageFiles.length) return [];

  const uploadPromises = imageFiles.map((file) => uploadToBlob(file));

  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error in uploadMultipleImages:', error);
    throw new Error('Failed to upload one or more images');
  }
}

export async function uploadSingleImage(formData: FormData): Promise<string> {
  const file = formData.get('upload') as File;
  if (!file) throw new Error('No image file provided');

  try {
    return await uploadToBlob(file);
  } catch (error) {
    console.error('Error in uploadSingleImage:', error);
    throw new Error('Failed to upload image');
  }
}

export async function deleteFileFromStorage(url: string): Promise<void> {
  if (!url) return;

  try {
    const blobUrl = new URL(url);
    const blobName = decodeURIComponent(blobUrl.pathname.substring(1));
    await del(blobName);
  } catch (error) {
    console.error('Error deleting file from storage:', error);
  }
}
