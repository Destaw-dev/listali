import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  redirect(`/${locale}/dashboard`);
}
