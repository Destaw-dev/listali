import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, Locale } from './config';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Asia/Jerusalem',
    now: new Date(),
    locale: locale as string,
  };
}); 