export const publicRoutes = [
  '/en',
  '/es',
  '/en/admin/login',
  '/es/admin/login',
  '/en/admin/register',
  '/es/admin/register',
];

export const authRoutes = [
  '/en/admin/login',
  '/es/admin/login',
  '/en/admin/register',
  '/es/admin/register',
];

export const apiRoutes = ['/api/auth'];

export const DEFAULT_LOGIN_REDIRECT = '/admin/launch';

/** Rutas publicas exactas, mas noticias y sus paginas (/es/noticias/pagina/2). */
export function isPublicPath(pathname: string) {
  return (
    publicRoutes.includes(pathname) ||
    /^\/(en|es)\/noticias(\/|$)/.test(pathname)
  );
}
