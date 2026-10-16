import sanitizeHtml from 'sanitize-html';

const LOOKS_LIKE_HTML = /<\/?[a-z][\s\S]*?>/i;

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Normaliza el cuerpo de una noticia a HTML seguro.
 * Acepta HTML del editor o texto plano (noticias antiguas) y devuelve null si
 * no queda contenido visible.
 */
export function newsBodyToHtml(body: unknown): string | null {
  if (typeof body !== 'string' || !body.trim()) return null;

  const source = LOOKS_LIKE_HTML.test(body)
    ? body
    : body
        .trim()
        .split(/\n{2,}/)
        .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
        .join('');

  const clean = sanitizeHtml(source, {
    allowedTags: [
      'p',
      'h2',
      'h3',
      'strong',
      'em',
      'u',
      's',
      'ul',
      'ol',
      'li',
      'blockquote',
      'hr',
      'br',
      'a',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      p: ['style'],
      h2: ['style'],
      h3: ['style'],
    },
    allowedStyles: {
      '*': { 'text-align': [/^(left|center|right|justify)$/] },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...(attribs.href ? { href: attribs.href } : {}),
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    },
  }).trim();

  const hasVisibleContent =
    sanitizeHtml(clean, { allowedTags: [], allowedAttributes: {} }).trim() !==
      '' || /<hr\s*\/?>/.test(clean);

  return hasVisibleContent ? clean : null;
}

/** Texto plano para vistas previas. Seguro en cliente: no usa sanitize-html. */
export function newsBodyToText(body: unknown): string {
  if (typeof body !== 'string') return '';
  return body
    .replace(/<\/(p|h2|h3|li|blockquote)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
