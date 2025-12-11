import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n/config';

export default createMiddleware({
  // A list of all locales that are supported
  locales: locales,
  
  // Used when no locale matches
  defaultLocale: defaultLocale,
  
  // Always show the locale in the URL
  localePrefix: 'always',
  
  // Use locale detection based on cookie first, then Accept-Language header
  localeDetection: true,
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(he|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
}; 