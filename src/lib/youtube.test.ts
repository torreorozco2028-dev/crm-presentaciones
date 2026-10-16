import { describe, expect, it } from 'vitest';
import { getYoutubeEmbedUrl, getYoutubeId } from './youtube';

describe('getYoutubeId', () => {
  const id = 'dQw4w9WgXcQ';

  it.each([
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=10s`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/live/${id}`,
  ])('extrae el id de %s', (link) => {
    expect(getYoutubeId(link)).toBe(id);
  });

  it.each([
    '',
    'no es un link',
    'https://vimeo.com/12345',
    'https://youtube.com/watch?v=corto',
    'https://evil.com/watch?v=dQw4w9WgXcQ',
    null,
    undefined,
    42,
  ])('devuelve null para %s', (value) => {
    expect(getYoutubeId(value)).toBeNull();
  });

  it('arma la url de embed sin cookies', () => {
    expect(getYoutubeEmbedUrl(`https://youtu.be/${id}`)).toBe(
      `https://www.youtube-nocookie.com/embed/${id}`
    );
    expect(getYoutubeEmbedUrl('https://vimeo.com/1')).toBeNull();
  });
});
