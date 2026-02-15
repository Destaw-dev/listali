'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { Locale, locales } from '../../i18n/config';
import { useUpdatePreferences } from '../../hooks/useSettings';
import { useThemeStore } from '../../store/themeStore';
import { Button } from './Button';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('LanguageSwitcher');
  const pathname = usePathname();
  const updatePreferencesMutation = useUpdatePreferences();
  const { theme } = useThemeStore();

  const switchLanguage = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    updatePreferencesMutation.mutate({ 
      language: newLocale, 
      theme: theme
    });
    
    window.location.href = `/${newLocale}${pathWithoutLocale}`;
  };

  return (
    <div className="relative inline-block text-left">
      <Button
        type="button"
        onClick={() => {
          const currentIndex = locales.indexOf(locale as Locale);
          const nextIndex = (currentIndex + 1) % locales.length;
          switchLanguage(locales[nextIndex]);
        }}
        variant="ghost"
        size="sm"
        rounded={true}
      >
        <Globe className="w-5 h-5 text-text-primary" />
      </Button>
      
      <div className="absolute -top-1 -inset-inline-end-1 w-4 h-4 bg-[var(--color-icon-primary-fg)] text-text-on-primary text-xs rounded-full flex items-center justify-center">
        {locale === 'he' ? t('hebrew') : t('english')}
      </div>
    </div>
  );
} 
