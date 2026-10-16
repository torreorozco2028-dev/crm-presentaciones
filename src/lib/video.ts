import { getTiktokId } from './tiktok';
import { getYoutubeId } from './youtube';

export type NewsVideo =
  | { provider: 'youtube'; id: string }
  | { provider: 'tiktok'; id: string };

/** Detecta el proveedor de un link de video (YouTube o TikTok) o devuelve null. */
export function parseVideo(raw: unknown): NewsVideo | null {
  const youtube = getYoutubeId(raw);
  if (youtube) return { provider: 'youtube', id: youtube };
  const tiktok = getTiktokId(raw);
  if (tiktok) return { provider: 'tiktok', id: tiktok };
  return null;
}
