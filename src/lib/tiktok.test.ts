import { describe, expect, it } from 'vitest';
import { getTiktokId, isTiktokShortLink } from './tiktok';
import { parseVideo } from './video';

const id = '7234567890123456789';

describe('getTiktokId', () => {
  it.each([
    `https://www.tiktok.com/@user/video/${id}`,
    `https://tiktok.com/@user.name/video/${id}?is_from_webapp=1`,
    `https://m.tiktok.com/@user/video/${id}`,
    `https://www.tiktok.com/embed/v2/${id}`,
  ])('extrae el id de %s', (link) => {
    expect(getTiktokId(link)).toBe(id);
  });

  it.each([
    '',
    null,
    'https://www.tiktok.com/@user',
    `https://evil.com/@user/video/${id}`,
    'https://www.tiktok.com/@user/video/123',
  ])('devuelve null para %s', (value) => {
    expect(getTiktokId(value)).toBeNull();
  });
});

describe('isTiktokShortLink', () => {
  it('reconoce links cortos', () => {
    expect(isTiktokShortLink('https://vm.tiktok.com/ZMabc/')).toBe(true);
    expect(isTiktokShortLink('https://www.tiktok.com/t/ZTabc/')).toBe(true);
    expect(isTiktokShortLink('https://evil.com/t/abc')).toBe(false);
  });
});

describe('parseVideo', () => {
  it('detecta el proveedor', () => {
    expect(parseVideo('https://youtu.be/dQw4w9WgXcQ')).toEqual({
      provider: 'youtube',
      id: 'dQw4w9WgXcQ',
    });
    expect(parseVideo(`https://www.tiktok.com/@u/video/${id}`)).toEqual({
      provider: 'tiktok',
      id,
    });
    expect(parseVideo('https://vimeo.com/1')).toBeNull();
  });
});
