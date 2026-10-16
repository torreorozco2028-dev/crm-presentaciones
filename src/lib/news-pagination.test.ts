import { describe, expect, it } from 'vitest';
import {
  getPageWindow,
  newsPageHref,
  parsePageParam,
  totalPagesFor,
} from './news-pagination';

describe('parsePageParam', () => {
  it.each([
    ['1', 1],
    ['2', 2],
    ['1000', 1000],
  ])('acepta %s', (raw, expected) => {
    expect(parsePageParam(raw)).toBe(expected);
  });

  it.each(['0', '-1', '1001', '1.5', 'abc', '', '99999', undefined, 3])(
    'rechaza %s',
    (raw) => {
      expect(parsePageParam(raw)).toBeNull();
    }
  );
});

describe('totalPagesFor', () => {
  it('nunca baja de 1 pagina', () => {
    expect(totalPagesFor(0, 6)).toBe(1);
    expect(totalPagesFor(6, 6)).toBe(1);
    expect(totalPagesFor(7, 6)).toBe(2);
  });
});

describe('newsPageHref', () => {
  it('la pagina 1 es la raiz de noticias', () => {
    expect(newsPageHref('es', 1)).toBe('/es/noticias');
    expect(newsPageHref('en', 3)).toBe('/en/noticias/pagina/3');
  });
});

describe('getPageWindow', () => {
  it('muestra todo si son pocas paginas', () => {
    expect(getPageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(getPageWindow(1, 1)).toEqual([1]);
  });

  it('agrega saltos entre extremos y la pagina actual', () => {
    expect(getPageWindow(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10]);
    expect(getPageWindow(1, 10)).toEqual([1, 2, 'gap', 10]);
    expect(getPageWindow(10, 10)).toEqual([1, 'gap', 9, 10]);
  });
});
