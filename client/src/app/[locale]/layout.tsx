import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Navigation } from '../../components/layout/Navigation';
import { Providers } from '../../components/providers/Providers';
import '../globals.css';
import { locales } from '../../i18n/config';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  
  if (locale === 'he') {
    return {
      title: 'רשימות קניות - ניהול רשימות קניות משותפות',
      description: 'אפליקציה לניהול רשימות קניות משותפות עם המשפחה והחברים. צור רשימות קניות, שתף עם המשפחה ועקוב אחרי הקניות שלך',
      keywords: ['רשימות קניות', 'משותף', 'קניות', 'משפחה', 'רשימה', 'גרופרי', 'מזון', 'בית'],
      openGraph: {
        title: 'רשימות קניות - ניהול רשימות קניות משותפות',
        description: 'אפליקציה לניהול רשימות קניות משותפות עם המשפחה והחברים',
        type: 'website',
        locale: 'he_IL',
        alternateLocale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'רשימות קניות - ניהול רשימות קניות משותפות',
        description: 'אפליקציה לניהול רשימות קניות משותפות עם המשפחה והחברים',
      },
      alternates: {
        canonical: '/he',
        languages: {
          'he': '/he',
          'en': '/en',
        },
      },
    };
  }
  
  // English metadata
  return {
    title: 'Shopping Lists - Collaborative Shopping Management',
    description: 'Application for managing collaborative shopping lists with family and friends. Create shopping lists, share with family and track your shopping',
    keywords: ['shopping lists', 'collaborative', 'family', 'groceries', 'shopping', 'food', 'home'],
    openGraph: {
      title: 'Shopping Lists - Collaborative Shopping Management',
      description: 'Application for managing collaborative shopping lists with family and friends',
      type: 'website',
      locale: 'en_US',
      alternateLocale: 'he_IL',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Shopping Lists - Collaborative Shopping Management',
      description: 'Application for managing collaborative shopping lists with family and friends',
    },
    alternates: {
      canonical: '/en',
      languages: {
        'he': '/he',
        'en': '/en',
      },
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} dir={locale === 'he' ? 'rtl' : 'ltr'}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers locale={locale}>
            <div id="root" className="min-h-screen">
              <Navigation />
              
              <div className="pt-0 md:pt-0">
                {children}
              </div>
              
              <footer className="text-center py-4 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm">
                <p className="text-xs text-muted px-4">
                  © 2025 Listali. {locale === 'he' ? 'כל הזכויות שמורות.' : 'All rights reserved.'}
                </p>
              </footer>
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
} 