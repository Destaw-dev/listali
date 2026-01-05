'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { FileText, Calendar, Shield, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';


export default function TermsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('terms');

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

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header Section */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="h-16 bg-gradient-to-l from-primary-500 to-primary-600" />
          <div className="px-6 pb-6 relative">
            <div className="flex justify-between items-end -mt-10 mb-4">
              <div className="w-16 h-16 rounded-xl bg-card border border-border p-1 shadow-md">
                <div className="w-full h-full bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 text-xl font-bold">
                  <FileText className="w-8 h-8" />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-text-primary">
                {t('subtitle')}
              </h1>
              <div className="flex items-center gap-2 text-sm text-text-muted mt-2">
                <Calendar className="w-4 h-4" />
                <span>{t('lastUpdated')}: {t('lastUpdatedDate')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <p className="text-text-muted leading-relaxed">
            {t('introduction')}
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-4">
          {/* Acceptance */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              {t('sections.acceptance.title')}
            </h2>
            <p className="text-text-muted leading-relaxed mb-3">
              {t('sections.acceptance.content')}
            </p>
          </div>

          {/* Use of Service */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              {t('sections.use.title')}
            </h2>
            <div className="space-y-3">
              <p className="text-text-muted leading-relaxed">
                {t('sections.use.content')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-muted mr-4">
                <li>{t('sections.use.rules.1')}</li>
                <li>{t('sections.use.rules.2')}</li>
                <li>{t('sections.use.rules.3')}</li>
                <li>{t('sections.use.rules.4')}</li>
              </ul>
            </div>
          </div>

          {/* User Accounts */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              {t('sections.accounts.title')}
            </h2>
            <p className="text-text-muted leading-relaxed">
              {t('sections.accounts.content')}
            </p>
          </div>

          {/* Privacy */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              {t('sections.privacy.title')}
            </h2>
            <p className="text-text-muted leading-relaxed">
              {t('sections.privacy.content')}
            </p>
          </div>

          {/* Intellectual Property */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              {t('sections.intellectual.title')}
            </h2>
            <p className="text-text-muted leading-relaxed">
              {t('sections.intellectual.content')}
            </p>
          </div>

          {/* Limitation of Liability */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning-600" />
              {t('sections.liability.title')}
            </h2>
            <p className="text-text-muted leading-relaxed">
              {t('sections.liability.content')}
            </p>
          </div>

          {/* Changes to Terms */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              {t('sections.changes.title')}
            </h2>
            <p className="text-text-muted leading-relaxed">
              {t('sections.changes.content')}
            </p>
          </div>

          {/* Contact */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              {t('sections.contact.title')}
            </h2>
            <p className="text-text-muted leading-relaxed">
              {t('sections.contact.content')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
