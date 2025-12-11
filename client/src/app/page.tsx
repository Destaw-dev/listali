import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { cookies } from 'next/headers';

export default async function RootPage() {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('NEXT_LOCALE')?.value;
  
  const detectedLocale = await getLocale();
  
  const locale = savedLocale || detectedLocale;
  
  const authToken = cookieStore.get('token')?.value;

  const isLoggedIn = authToken !== 'none' && authToken !== undefined;

  if (isLoggedIn) {
    redirect(`/${locale}/dashboard`);
  } else {
    redirect(`/${locale}/welcome`);
  }
}
