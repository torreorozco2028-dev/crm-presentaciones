import authConfig from './auth.config';
import NextAuth from 'next-auth';
export const { auth } = NextAuth(authConfig);

import {
  authRoutes,
  publicRoutes,
  DEFAULT_LOGIN_REDIRECT,
  apiRoutes,
} from './routes';
import { NextResponse } from 'next/server';

import { i18n } from './i18n-config';
import createMiddleware from 'next-intl/middleware';

/**
 * Configuration for the internationalization middleware
 * @see https://next-intl-docs.vercel.app/docs/routing/middleware
 */
const intlMiddleware = createMiddleware({
  locales: i18n.locales,
  defaultLocale: i18n.defaultLocale,
  localePrefix: 'always',
});

/**
 * Main middleware function that handles authentication, internationalization, and routing
 * @param {Request} req - The incoming request object
 * @returns {Promise<NextResponse>} The response object with appropriate redirects or content
 */

export default auth(async (req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req?.auth;

  const isApiRoute = apiRoutes.some((route) => pathname.startsWith(route));
  if (isApiRoute) return NextResponse.next();

  const response = await intlMiddleware(req);
  if (response.headers.has('Location')) return response;

  const locale = nextUrl.pathname.split('/')[1] || i18n.defaultLocale;

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);

  if (pathname === '/' || pathname === `/${locale}`) {
    const target = isLoggedIn ? DEFAULT_LOGIN_REDIRECT : '/auth/login';
    return NextResponse.redirect(new URL(`/${locale}${target}`, nextUrl));
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/${locale}${DEFAULT_LOGIN_REDIRECT}`, nextUrl)
      );
    }
    return response;
  }

  if (!isLoggedIn && !isPublicRoute) {
    if (!pathname.includes('/auth/login')) {
      const redirectUrl = new URL(`/${locale}/auth/login`, nextUrl);
      redirectUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
});

/**
 * Matcher configuration for the middleware
 * Defines which routes should be processed by this middleware
 * @type {object}
 */
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/(api|trpc)(.*)'],
};
