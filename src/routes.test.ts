import { describe, expect, it } from 'vitest';
import { isPublicPath } from './routes';

describe('isPublicPath', () => {
  it.each([
    '/es',
    '/en',
    '/es/noticias',
    '/en/noticias/pagina/2',
    '/es/admin/login',
  ])('%s es publica', (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each([
    '/es/admin/news',
    '/es/admin/launch',
    '/es/noticiasfalsas',
    '/fr/noticias',
    '/es/presentations/1/building',
  ])('%s requiere sesion', (path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});
