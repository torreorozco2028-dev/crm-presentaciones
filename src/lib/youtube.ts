const YOUTUBE_ID = /^[\w-]{11}$/;

/** Devuelve el id de un link de YouTube (watch, youtu.be, shorts, embed) o null. */
export function getYoutubeId(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m)\./, '');
  let id: string | undefined;

  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') {
      id = url.searchParams.get('v') ?? undefined;
    } else {
      const [, kind, value] = url.pathname.split('/');
      if (kind === 'embed' || kind === 'shorts' || kind === 'live') id = value;
    }
  }

  return id && YOUTUBE_ID.test(id) ? id : null;
}

export function getYoutubeEmbedUrl(raw: unknown): string | null {
  const id = getYoutubeId(raw);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
