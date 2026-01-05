'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function Footer() {
  const params = useParams();
  const locale = params?.locale as string || 'he';
  const t = useTranslations('footer');

  return (
    <footer className="text-center py-4 bg-background shadow-md text-text-primary">
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
        <p className="text-xs text-text-muted px-4">
          © 2025 Listali. {t('rights')}
        </p>
        <div className="flex gap-4 text-xs">
          <Link 
            href={`/${locale}/about`}
            className="text-text-muted hover:text-primary-600 transition-colors"
          >
            {t('about')}
          </Link>
          <span className="text-text-muted">|</span>
          <Link 
            href={`/${locale}/terms`}
            className="text-text-muted hover:text-primary-600 transition-colors"
          >
            {t('terms')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
