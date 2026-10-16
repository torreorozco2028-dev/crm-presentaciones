'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/auth';
import BuildingNewsEntity from '@/server/db/entities/building-news';
import { LANDING_NEWS_TAG } from '@/server/db/queries/landing';
import { isAdminRole } from '@/lib/ownership';
import { parseNewsTitleColor } from '@/lib/news-title-color';
import { parseVideo } from '@/lib/video';
import {
  fetchTiktokThumbnail,
  isTiktokShortLink,
  resolveTiktokShortLink,
} from '@/lib/tiktok';
import { newsBodyToHtml } from '@/lib/news-html';
import { parseImageBatch } from '@/lib/presentation-gallery';
import { NEWS_ADMIN_PAGE_SIZE, totalPagesFor } from '@/lib/news-pagination';
import {
  uploadSingleImage,
  uploadMultipleImages,
  deleteFilesFromStorage,
} from '@/services/storage';

const entity = new BuildingNewsEntity();

async function assertAdmin() {
  const session = await auth();
  if (!isAdminRole(session?.user?.role)) {
    throw new Error('No tienes permisos para gestionar noticias');
  }
}

/**
 * Miniatura del video: solo TikTok la necesita. Se usa la subida a mano; si
 * no hay, se reutiliza si el link no cambio y, si no se puede obtener, la noticia se guarda igual sin ella.
 */
async function resolveVideoThumbnail(
  videoUrl: string | null,
  manualThumbnail: File | null,
  existing?: { video_url: string | null; video_thumbnail_url: string | null }
) {
  if (!videoUrl || parseVideo(videoUrl)?.provider !== 'tiktok') return null;
  // La miniatura subida a mano tiene prioridad sobre la de TikTok.
  if (manualThumbnail) return uploadSingleImage(manualThumbnail);
  if (existing?.video_url === videoUrl && existing.video_thumbnail_url) {
    return existing.video_thumbnail_url;
  }
  const file = await fetchTiktokThumbnail(videoUrl);
  if (!file) return null;
  try {
    return await uploadSingleImage(file);
  } catch (error) {
    console.error('[tiktok] no se pudo subir la miniatura', error);
    return null;
  }
}

/** Aviso para el admin cuando un video de TikTok quedo sin miniatura. */
function thumbnailWarning(
  videoUrl: string | null,
  thumbnailUrl: string | null
) {
  return videoUrl &&
    parseVideo(videoUrl)?.provider === 'tiktok' &&
    !thumbnailUrl
    ? 'No se pudo obtener la miniatura de TikTok. Guarda la noticia de nuevo en unos minutos para reintentar.'
    : undefined;
}

function refreshViews() {
  revalidatePath('/admin/news');
  revalidateTag(LANDING_NEWS_TAG);
  revalidatePath('/en');
  revalidatePath('/es');
  revalidatePath('/[locale]/noticias', 'page');
  revalidatePath('/[locale]/noticias/pagina/[page]', 'page');
}

function getManualThumbnail(formData: FormData) {
  const file = formData.get('video_thumbnail');
  return file instanceof File && file.size > 0 ? file : null;
}

async function readFields(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  if (!title) throw new Error('El título es obligatorio');

  const newsDate = String(formData.get('news_date') ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newsDate)) {
    throw new Error('La fecha no es válida');
  }

  let videoUrl = String(formData.get('video_url') ?? '').trim();
  if (videoUrl && isTiktokShortLink(videoUrl)) {
    videoUrl = (await resolveTiktokShortLink(videoUrl)) ?? videoUrl;
  }
  if (videoUrl && !parseVideo(videoUrl)) {
    throw new Error('El link de video debe ser de YouTube o TikTok');
  }

  const progressRaw = String(formData.get('progress_percent') ?? '').trim();
  let progress: number | null = null;
  if (progressRaw) {
    progress = Number(progressRaw);
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      throw new Error('El avance debe ser un número entre 0 y 100');
    }
  }

  return {
    title,
    body: newsBodyToHtml(formData.get('body')),
    news_date: newsDate,
    video_url: videoUrl || null,
    progress_percent: progress,
    show_progress: formData.get('show_progress') !== 'false',
    title_color: parseNewsTitleColor(formData.get('title_color')),
    is_published: formData.get('is_published') === 'true',
  };
}

function getNewFiles(formData: FormData) {
  const files = formData.getAll('batch_images') as File[];
  return files.filter((f) => f.size > 0);
}

export async function getNewsByBuildingAction(buildingId: string, page = 1) {
  await assertAdmin();
  const safePage = Number.isInteger(page) && page >= 1 ? page : 1;
  const { items, total } = await entity.getNewsPageByBuilding(
    buildingId,
    NEWS_ADMIN_PAGE_SIZE,
    (safePage - 1) * NEWS_ADMIN_PAGE_SIZE
  );
  return {
    items,
    total,
    page: safePage,
    totalPages: totalPagesFor(total, NEWS_ADMIN_PAGE_SIZE),
  };
}

export async function createNewsAction(formData: FormData) {
  try {
    await assertAdmin();
    const buildingId = String(formData.get('buildingId') ?? '');
    if (!buildingId) throw new Error('Selecciona un edificio');

    const fields = await readFields(formData);
    const urls = await uploadMultipleImages(getNewFiles(formData));
    const video_thumbnail_url = await resolveVideoThumbnail(
      fields.video_url,
      getManualThumbnail(formData)
    );

    const created = await entity.createNews({
      ...fields,
      video_thumbnail_url,
      buildingId,
      batch_images: urls,
    });

    refreshViews();
    return {
      success: true,
      data: created,
      warning: thumbnailWarning(fields.video_url, video_thumbnail_url),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateNewsAction(id: string, formData: FormData) {
  try {
    await assertAdmin();
    const existing = await entity.getNewsById(id);
    if (!existing) throw new Error('Noticia no encontrada');

    const fields = await readFields(formData);

    const existingImages = parseImageBatch(existing.batch_images);
    const removed = parseImageBatch(
      formData.get('removed_batch_images')
    ).filter((url) => existingImages.includes(url));
    const ordered = formData.get('ordered_existing_batch_images')
      ? parseImageBatch(formData.get('ordered_existing_batch_images')).filter(
          (url) => existingImages.includes(url)
        )
      : existingImages;

    const kept = ordered.filter((url) => !removed.includes(url));
    const newUrls = await uploadMultipleImages(getNewFiles(formData));

    const video_thumbnail_url = await resolveVideoThumbnail(
      fields.video_url,
      getManualThumbnail(formData),
      existing
    );

    const updated = await entity.updateNews(id, {
      ...fields,
      video_thumbnail_url,
      batch_images: [...kept, ...newUrls],
    });

    const staleFiles = [...removed];
    if (
      existing.video_thumbnail_url &&
      existing.video_thumbnail_url !== video_thumbnail_url
    ) {
      staleFiles.push(existing.video_thumbnail_url);
    }
    if (staleFiles.length > 0) await deleteFilesFromStorage(staleFiles);

    refreshViews();
    return {
      success: true,
      data: updated,
      warning: thumbnailWarning(fields.video_url, video_thumbnail_url),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleNewsPublishedAction(
  id: string,
  isPublished: boolean
) {
  try {
    await assertAdmin();
    await entity.updateNews(id, { is_published: isPublished });
    refreshViews();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteNewsAction(id: string) {
  try {
    await assertAdmin();
    const news = await entity.getNewsById(id);
    if (!news) throw new Error('Noticia no encontrada');

    await entity.deleteNews(id);

    const files = parseImageBatch(news.batch_images);
    if (news.video_thumbnail_url) files.push(news.video_thumbnail_url);
    if (files.length > 0) await deleteFilesFromStorage(files);

    refreshViews();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
