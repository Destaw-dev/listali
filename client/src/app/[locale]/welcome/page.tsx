'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '../../../i18n/navigation';
import { useAuthStore } from '../../../store/authStore';
import { ShoppingCart, Users, Zap, CheckCircle2, TrendingUp, Shield } from 'lucide-react';
import { Button, Card, CardBody, SkeletonCard } from '../../../components/common';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { iconSizes } from '../../../lib/iconSizes';
import { gradients } from '../../../lib/gradients';
import { typography } from '../../../lib/typography';

export default function WelcomePage() {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated, setGuestMode } = useAuthStore();

  const { safeToShow } = useAuthRedirect({
    redirectTo: '/dashboard',
    requireAuth: false,
  });

  const handleContinueAsGuest = () => {
    setGuestMode();
    router.push('/guest-dashboard');
  };

  if (!safeToShow) {
    return (
      <div className="min-h-screen bg-card">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <SkeletonCard />
          <div className="grid md:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-neutral-950 dark:via-background dark:to-neutral-900">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-accent-500/5 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative container mx-auto px-4 py-8 md:py-12">

        {/* ========== HERO SECTION ========== */}
        <Card variant="glass" className="mb-16 shadow-2xl animate-fade-in-up overflow-hidden">
          <CardBody className="text-center py-16 md:py-24 px-6 relative">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-secondary-500/5 pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto">
              {/* App Icon */}
              <div className={`inline-flex items-center justify-center w-28 h-28 md:w-36 md:h-36 mb-8 ${gradients.primary} rounded-3xl shadow-2xl hover:scale-105 transition-transform duration-500`}>
                <img src="/icon.svg" alt="Listali icon" className="w-16 h-16 md:w-24 md:h-24" />
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-600 text-transparent bg-clip-text leading-tight">
                {t('welcome.title')}
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-text-muted max-w-3xl mx-auto leading-relaxed mb-12 font-medium">
                {t('welcome.subtitle')}
              </p>

              {/* Primary Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Button
                  variant="primary"
                  onClick={() => router.push('/auth/register')}
                  size="lg"
                  className="shadow-2xl hover:shadow-primary/50 hover:scale-105 transition-all duration-300 text-lg px-10 py-6 min-w-[200px]"
                >
                  {t('welcome.getStartedFree')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/auth/login')}
                  size="lg"
                  className="shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg px-10 py-6 min-w-[200px]"
                >
                  {t('welcome.loginButton')}
                </Button>
              </div>

              {/* Guest Mode Button */}
              <div className="mb-10">
                <button
                  onClick={handleContinueAsGuest}
                  className="text-text-muted hover:text-primary transition-colors text-sm font-medium underline decoration-dotted underline-offset-4 hover:decoration-solid"
                >
                  {t('welcome.continueAsGuest')}
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`${iconSizes.sm} text-success`} />
                  <span>{t('welcome.benefits.free')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`${iconSizes.sm} text-success`} />
                  <span>{t('welcome.benefits.noCard')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`${iconSizes.sm} text-success`} />
                  <span>{t('welcome.benefits.instant')}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* ========== FEATURE CARDS ========== */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-24">
          <Card
            variant="elevated"
            hover
            className="text-center animate-fade-in-up shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            <CardBody className="py-10 px-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 ${gradients.success} rounded-2xl mb-6 shadow-md hover:scale-110 transition-transform duration-300`}>
                <Users className={`${iconSizes.lg} text-white`} />
              </div>
              <h3 className={`${typography.h4} text-text-primary mb-4`}>
                {t('welcome.features.groups.title')}
              </h3>
              <p className={`${typography.bodySmall} text-text-muted leading-relaxed`}>
                {t('welcome.features.groups.description')}
              </p>
            </CardBody>
          </Card>

          <Card
            variant="elevated"
            hover
            className="text-center animate-fade-in-up shadow-lg hover:shadow-2xl transition-all duration-300 animation-delay-100"
          >
            <CardBody className="py-10 px-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 ${gradients.primary} rounded-2xl mb-6 shadow-md hover:scale-110 transition-transform duration-300`}>
                <ShoppingCart className={`${iconSizes.lg} text-white`} />
              </div>
              <h3 className={`${typography.h4} text-text-primary mb-4`}>
                {t('welcome.features.lists.title')}
              </h3>
              <p className={`${typography.bodySmall} text-text-muted leading-relaxed`}>
                {t('welcome.features.lists.description')}
              </p>
            </CardBody>
          </Card>

          <Card
            variant="elevated"
            hover
            className="text-center animate-fade-in-up shadow-lg hover:shadow-2xl transition-all duration-300 animation-delay-200"
          >
            <CardBody className="py-10 px-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 ${gradients.warning} rounded-2xl mb-6 shadow-md hover:scale-110 transition-transform duration-300`}>
                <Zap className={`${iconSizes.lg} text-white`} />
              </div>
              <h3 className={`${typography.h4} text-text-primary mb-4`}>
                {t('welcome.features.realtime.title')}
              </h3>
              <p className={`${typography.bodySmall} text-text-muted leading-relaxed`}>
                {t('welcome.features.realtime.description')}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* ========== WHY CHOOSE US ========== */}
        <div className="mb-24">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className={`${typography.h2} mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-transparent bg-clip-text`}>
              {t('welcome.whyChoose.title')}
            </h2>
            <p className={`${typography.body} text-text-muted max-w-2xl mx-auto`}>
              {t('welcome.whyChoose.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🚀', title: t('welcome.benefits.fast.title'), desc: t('welcome.benefits.fast.desc') },
              { icon: '🔒', title: t('welcome.benefits.secure.title'), desc: t('welcome.benefits.secure.desc') },
              { icon: '💡', title: t('welcome.benefits.smart.title'), desc: t('welcome.benefits.smart.desc') },
              { icon: '🌍', title: t('welcome.benefits.anywhere.title'), desc: t('welcome.benefits.anywhere.desc') },
            ].map((benefit, idx) => (
              <Card
                key={idx}
                variant="glass"
                className={`text-center p-6 animate-fade-in-up hover:scale-105 transition-transform duration-300 ${
                  idx === 1 ? 'animation-delay-100' : idx === 2 ? 'animation-delay-200' : idx === 3 ? 'animation-delay-300' : ''
                }`}
              >
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className={`${typography.h5} text-text-primary mb-2`}>{benefit.title}</h3>
                <p className={`${typography.caption} text-text-muted`}>{benefit.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* ========== HOW IT WORKS ========== */}
        <Card variant="elevated" className="mb-20 shadow-2xl">
          <CardBody className="p-8 md:p-12">
            <h2 className={`${typography.h2} text-center mb-12 bg-gradient-to-r from-accent-600 to-primary-600 text-transparent bg-clip-text`}>
              {t('welcome.howItWorks.title')}
            </h2>
            <div className="grid md:grid-cols-3 gap-10">
              {[
                { step: '1', title: t('welcome.steps.create.title'), desc: t('welcome.steps.create.desc'), icon: '📝' },
                { step: '2', title: t('welcome.steps.invite.title'), desc: t('welcome.steps.invite.desc'), icon: '👥' },
                { step: '3', title: t('welcome.steps.shop.title'), desc: t('welcome.steps.shop.desc'), icon: '🛒' },
              ].map((step, idx) => (
                <div key={idx} className="relative text-center animate-fade-in-up" style={{ animationDelay: `${idx * 150}ms` }}>
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${gradients.accent} rounded-full text-white font-bold text-2xl mb-4 shadow-lg`}>
                    {step.step}
                  </div>
                  <div className="text-4xl mb-3">{step.icon}</div>
                  <h3 className={`${typography.h4} text-text-primary mb-3`}>{step.title}</h3>
                  <p className={`${typography.bodySmall} text-text-muted`}>{step.desc}</p>
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-accent-500 to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* ========== STATS SECTION ========== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {[
            { number: '10K+', label: t('welcome.stats.users'), icon: Users },
            { number: '50K+', label: t('welcome.stats.lists'), icon: ShoppingCart },
            { number: '1M+', label: t('welcome.stats.items'), icon: TrendingUp },
            { number: '99%', label: t('welcome.stats.satisfaction'), icon: Shield },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card
                key={idx}
                variant="glass"
                className={`text-center p-6 animate-fade-in-up hover:scale-105 transition-transform duration-300 ${
                  idx === 1 ? 'animation-delay-100' : idx === 2 ? 'animation-delay-200' : idx === 3 ? 'animation-delay-300' : ''
                }`}
              >
                <Icon className={`${iconSizes.lg} mx-auto mb-3 text-primary-500`} />
                <div className={`${typography.h1} bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent mb-2`}>
                  {stat.number}
                </div>
                <p className={`${typography.caption} text-text-muted font-medium`}>{stat.label}</p>
              </Card>
            );
          })}
        </div>

        {/* ========== FINAL CTA ========== */}
        <Card variant="elevated" className={`${gradients.primary} text-white shadow-2xl`}>
          <CardBody className="text-center py-16 px-6">
            <h2 className={`${typography.h2} mb-4 text-white`}>
              {t('welcome.finalCTA.title')}
            </h2>
            <p className={`${typography.bodyLarge} mb-10 opacity-90 max-w-2xl mx-auto`}>
              {t('welcome.finalCTA.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="accent"
                onClick={() => router.push('/auth/register')}
                size="lg"
                className="shadow-xl hover:shadow-2xl bg-white text-primary-700 hover:bg-white/90 font-semibold"
              >
                {t('welcome.getStartedFree')}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/auth/login')}
                size="lg"
                className="text-white border-white hover:bg-white/10 shadow-lg font-semibold"
              >
                {t('welcome.loginButton')}
              </Button>
            </div>
          </CardBody>
        </Card>

      </div>
    </div>
  );
}
