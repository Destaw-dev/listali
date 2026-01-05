'use client';
import { Info, Users, ShoppingCart, Zap, Shield, Heart, ArrowLeft, ArrowRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';


export default function AboutPage() {
  const params = useParams();
  const locale = params?.locale as string || 'he';
  const t = useTranslations('about');

  return (
    <div className="min-h-screen bg-surface pb-12">
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}`}
              className="cursor-pointer"
            >
              {locale !== 'he' ? <ArrowLeft className="w-4 h-4 text-text-primary" /> : <ArrowRight className="w-4 h-4 text-text-primary" />}
            </Link>
            <h1 className="text-xl font-bold text-text-primary">{t('title')}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="h-16 bg-gradient-to-l from-primary-500 to-primary-600" />
          <div className="px-6 pb-6 relative">
            <div className="flex justify-between items-end -mt-10 mb-4">
              <div className="w-16 h-16 rounded-xl bg-card border border-border p-1 shadow-md">
                <div className="w-full h-full bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 text-xl font-bold">
                  <Info className="w-8 h-8 text-primary-600" />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-text-primary">
                {t('subtitle')}
              </h1>
              <p className="text-text-muted mt-2 leading-relaxed">
                {t('description')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary-600" />
            {t('mission.title')}
          </h2>
          <p className="text-text-muted leading-relaxed">
            {t('mission.description')}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-600" />
            {t('features.title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-surface rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-text-primary">{t('features.groups.title')}</h3>
              </div>
              <p className="text-sm text-text-muted">{t('features.groups.description')}</p>
            </div>

            <div className="p-4 bg-surface rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingCart className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-text-primary">{t('features.lists.title')}</h3>
              </div>
              <p className="text-sm text-text-muted">{t('features.lists.description')}</p>
            </div>

            <div className="p-4 bg-surface rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-text-primary">{t('features.realtime.title')}</h3>
              </div>
              <p className="text-sm text-text-muted">{t('features.realtime.description')}</p>
            </div>

            <div className="p-4 bg-surface rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-text-primary">{t('features.privacy.title')}</h3>
              </div>
              <p className="text-sm text-text-muted">{t('features.privacy.description')}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-text-primary mb-1">{t('version.title')}</h3>
              <p className="text-sm text-text-muted">{t('version.number')}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-muted">{t('version.lastUpdated')}</p>
              <p className="text-sm font-medium text-text-primary">{t('version.date')}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">
            {t('contact.title')}
          </h2>
          <p className="text-text-muted leading-relaxed mb-4">
            {t('contact.description')}
          </p>
          <p className="text-sm text-text-muted">
            {t('contact.email')}
          </p>
        </div>
      </div>
    </div>
  );
}
