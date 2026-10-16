const TIKTOK_ID = /^\d{15,25}$/;

/** Devuelve el id de un link completo de TikTok (/@usuario/video/ID, /embed/v2/ID) o null. */
export function getTiktokId(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m)\./, '');
  if (host !== 'tiktok.com') return null;

  const parts = url.pathname.split('/').filter(Boolean);
  let id: string | undefined;
  if (parts[1] === 'video') id = parts[2];
  else if (parts[0] === 'embed' && parts[1] === 'v2') id = parts[2];
  else if (parts[0] === 'player' && parts[1] === 'v1') id = parts[2];

  return id && TIKTOK_ID.test(id) ? id : null;
}

/** Links cortos que hay que seguir para obtener el id (vm.tiktok.com, vt.tiktok.com, tiktok.com/t/...). */
export function isTiktokShortLink(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.replace(/^www\./, '');
    return (
      url.protocol === 'https:' &&
      (host === 'vm.tiktok.com' ||
        host === 'vt.tiktok.com' ||
        (host === 'tiktok.com' && url.pathname.startsWith('/t/')))
    );
  } catch {
    return false;
  }
}

/** Sigue la redireccion de un link corto y devuelve el link completo, o null. */
export async function resolveTiktokShortLink(
  raw: string
): Promise<string | null> {
  if (!isTiktokShortLink(raw)) return null;
  try {
    const res = await fetch(raw.trim(), {
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
      headers: { 'user-agent': 'Mozilla/5.0' },
    });
    return getTiktokId(res.url) ? res.url : null;
  } catch {
    return null;
  }
}

export function getTiktokEmbedUrl(id: string): string {
  return `https://www.tiktok.com/player/v1/${id}?rel=0&description=0`;
}

const OEMBED_RETRY_DELAY_MS = 1500;

/** Pide el oEmbed y reintenta una vez si TikTok limita las consultas (429). */
async function fetchOembed(videoUrl: string): Promise<Response> {
  const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
  let res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, OEMBED_RETRY_DELAY_MS));
    res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
  }
  return res;
}

/**
 * Descarga la miniatura de un video via oEmbed. La URL de TikTok vence a las
 * pocas horas, por eso se baja el archivo para guardarlo en nuestro storage.
 * Si falla devuelve null y deja el motivo en el log del servidor.
 */
export async function fetchTiktokThumbnail(
  videoUrl: string
): Promise<File | null> {
  try {
    const oembed = await fetchOembed(videoUrl);
    if (!oembed.ok) {
      console.error(
        `[tiktok] oEmbed respondio ${oembed.status} para ${videoUrl}`
      );
      return null;
    }
    const { thumbnail_url: thumbnailUrl } = await oembed.json();
    if (typeof thumbnailUrl !== 'string') {
      console.error(`[tiktok] oEmbed sin thumbnail_url para ${videoUrl}`);
      return null;
    }

    const image = await fetch(thumbnailUrl, {
      signal: AbortSignal.timeout(8000),
    });
    const type = image.headers.get('content-type') ?? '';
    if (!image.ok || !type.startsWith('image/')) {
      console.error(
        `[tiktok] no se pudo bajar la miniatura (${image.status}, ${type})`
      );
      return null;
    }

    const ext = type.includes('png')
      ? 'png'
      : type.includes('webp')
        ? 'webp'
        : 'jpg';
    return new File(
      [await image.arrayBuffer()],
      `tiktok-${Date.now()}.${ext}`,
      {
        type,
      }
    );
  } catch (error) {
    console.error(`[tiktok] error obteniendo miniatura de ${videoUrl}`, error);
    return null;
  }
}
