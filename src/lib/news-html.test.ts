import { describe, expect, it } from 'vitest';
import { newsBodyToHtml, newsBodyToText } from './news-html';

describe('newsBodyToHtml', () => {
  it('conserva el formato permitido', () => {
    const html =
      '<h2>Titulo</h2><p style="text-align:center"><strong>Hola</strong> <em>mundo</em></p><ul><li>uno</li></ul>';
    expect(newsBodyToHtml(html)).toBe(html);
    expect(newsBodyToHtml(html.replace('align:', 'align: '))).toBe(html);
  });

  it('elimina scripts, handlers y estilos peligrosos', () => {
    const out = newsBodyToHtml(
      '<p onclick="x()" style="position:fixed;text-align:left">a<script>alert(1)</script><img src=x onerror=alert(1)></p>'
    )!;
    expect(out).not.toMatch(/script|onclick|onerror|img|position/);
    expect(out).toContain('text-align:left');
  });

  it('bloquea links javascript: y fuerza rel/target seguros', () => {
    const out = newsBodyToHtml(
      '<p><a href="javascript:alert(1)">mal</a> <a href="https://a.com" onclick="x()">bien</a></p>'
    )!;
    expect(out).not.toContain('javascript:');
    expect(out).toContain('href="https://a.com"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });

  it('convierte texto plano antiguo en parrafos escapados', () => {
    expect(newsBodyToHtml('uno\ndos\n\ntres & cuatro')).toBe(
      '<p>uno<br />dos</p><p>tres &amp; cuatro</p>'
    );
  });

  it('devuelve null si no hay contenido visible', () => {
    expect(newsBodyToHtml('')).toBeNull();
    expect(newsBodyToHtml('   ')).toBeNull();
    expect(newsBodyToHtml('<p></p>')).toBeNull();
    expect(newsBodyToHtml(undefined)).toBeNull();
  });
});

describe('newsBodyToText', () => {
  it('quita las etiquetas y separa bloques', () => {
    expect(newsBodyToText('<h2>Hola</h2><p>mundo &amp; co</p>')).toBe(
      'Hola mundo & co'
    );
    expect(newsBodyToText(null)).toBe('');
  });
});
