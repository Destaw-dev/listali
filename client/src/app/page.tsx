import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale } from '../i18n/config';

export default async function RootPage() {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('NEXT_LOCALE')?.value;

  let locale = savedLocale;
  if (!locale) {
    try {
      locale = await getLocale();
    } catch {
      locale = defaultLocale;
    }
  }
  if (!locale || !['he', 'en'].includes(locale)) {
    locale = defaultLocale;
  }

  const authToken = cookieStore.get('token')?.value;
  const isLoggedIn = authToken !== 'none' && authToken !== undefined;

  if (isLoggedIn) {
    redirect(`/${locale}/dashboard`);
  } else {
    redirect(`/${locale}/welcome`);
  }
}
