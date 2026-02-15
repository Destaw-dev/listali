'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '../../../i18n/navigation';
import { useAuthStore } from '../../../store/authStore';
import {
  ShoppingCart,
  Users,
  Zap,
  CheckCircle2,
  ClipboardList,
  UserPlus,
  Group,
} from 'lucide-react';
import { Button, Card, CardBody, SkeletonCard } from '../../../components/common';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { iconSizes } from '../../../lib/iconSizes';
import { gradients } from '../../../lib/gradients';
import { typography } from '../../../lib/typography';
import { ListaliIcon } from '@/components/common/ListaliIcon';

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

const featureCards = [
  {
    Icon: Users,
    gradient: gradients.success,
    titleKey: 'welcome.features.groups.title',
    descKey: 'welcome.features.groups.description',
  },
  {
    Icon: ShoppingCart,
    gradient: gradients.primary,
    titleKey: 'welcome.features.lists.title',
    descKey: 'welcome.features.lists.description',
  },
  {
    Icon: Zap,
    gradient: gradients.warning,
    titleKey: 'welcome.features.realtime.title',
    descKey: 'welcome.features.realtime.description',
  },
];


  const benefits = [
    { icon: '🚀', title: t('welcome.benefits.fast.title'), desc: t('welcome.benefits.fast.desc') },
    { icon: '🗃️', title: t('welcome.benefits.products.title'), desc: t('welcome.benefits.products.desc') },
    { icon: '💡', title: t('welcome.benefits.smart.title'), desc: t('welcome.benefits.smart.desc') },
    { icon: '🌍', title: t('welcome.benefits.anywhere.title'), desc: t('welcome.benefits.anywhere.desc') },
  ]

  const steps = [
    { step: '1', title: t('welcome.steps.createGroup.title'), desc: t('welcome.steps.createGroup.desc'), icon: Group },
    { step: '2', title: t('welcome.steps.createList.title'), desc: t('welcome.steps.createList.desc'), icon: ClipboardList },
    { step: '3', title: t('welcome.steps.invite.title'), desc: t('welcome.steps.invite.desc'), icon: UserPlus },
    { step: '4', title: t('welcome.steps.shop.title'), desc: t('welcome.steps.shop.desc'), icon: ShoppingCart },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-background)] to-[var(--color-status-secondary-soft)]">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 inset-inline-start-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 inset-inline-end-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative container mx-auto px-4 py-8 md:py-12">

        <Card variant="glass" className="mb-16 shadow-2xl animate-fade-in-up overflow-hidden">
          <CardBody className="text-center py-8 px-6 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-secondary-500/5 pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto">
              <div
                className={`inline-flex items-center justify-center w-28 h-28 md:w-36 md:h-36 ${gradients.primary} rounded-3xl shadow-2xl hover:scale-105 transition-transform duration-500`}
              >
              <ListaliIcon className="w-16 h-16 md:w-24 md:h-24 transition-transform duration-300 group-hover:scale-105" />

              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-600 text-transparent bg-clip-text leading-tight mb-2">
                {t('welcome.title')}
              </h1>
              <div className='sm:space-y-8 space-y-3'>
              <p className="text-xl md:text-2xl text-text-muted max-w-3xl mx-auto leading-relaxed font-medium">
                {t('welcome.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
                  className='min-w-[200px]'
                >
                  {t('welcome.loginButton')}
                </Button>
              </div>

                <Button
                  variant="ghostSurface"
                  size="md"
                  onClick={handleContinueAsGuest}
                >
                  {t('welcome.continueAsGuest')}
                </Button>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted">
                <div className="flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5">
                  <CheckCircle2 className={`${iconSizes.sm} text-success`} />
                  <span>{t('welcome.benefits.free')}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5">
                  <CheckCircle2 className={`${iconSizes.sm} text-success`} />
                  <span>{t('welcome.benefits.noCard')}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5">
                  <CheckCircle2 className={`${iconSizes.sm} text-success`} />
                  <span>{t('welcome.benefits.instant')}</span>
                </div>
              </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-16">
          {featureCards.map(({ Icon, gradient, titleKey, descKey }, idx) => (
            <Card
              key={titleKey}
              variant="elevated"
              hover
              className={`text-center animate-fade-in-up shadow-lg hover:shadow-2xl transition-all duration-300 ${
                idx === 1 ? 'animation-delay-100' : idx === 2 ? 'animation-delay-200' : ''
              }`}
            >
              <CardBody className="py-10 px-6">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 ${gradient} rounded-2xl mb-6 shadow-md hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`${iconSizes.lg} text-text-on-primary`} />
                </div>
                <h3 className={`${typography.h4} text-text-primary mb-4`}>{t(titleKey)}</h3>
                <p className={`${typography.bodySmall} text-text-muted leading-relaxed`}>
                  {t(descKey)}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="mb-16">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className={`${typography.h2} mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-transparent bg-clip-text`}>
              {t('welcome.whyChoose.title')}
            </h2>
            <p className={`${typography.body} text-text-muted max-w-2xl mx-auto`}>
              {t('welcome.whyChoose.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => (
              <Card
                key={idx}
                variant="glass"
                className={`text-center p-6 animate-fade-in-up hover:scale-105 transition-transform duration-300 ${
                  idx === 1 ? 'animation-delay-100' : idx === 2 ? 'animation-delay-200' : idx === 3 ? 'animation-delay-300' : ''
                }`}
              >
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className={`${typography.h5} text-text-primary mb-2`}>{benefit.title}</h3>
                <p className={`${typography.bodySmall} text-text-muted`}>{benefit.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        <Card variant="elevated" className="mb-16 shadow-2xl">
          <CardBody className="p-8 md:p-12">
            <h2 className={`${typography.h2} text-center mb-12 bg-gradient-to-r from-accent-600 to-primary-600 text-transparent bg-clip-text`}>
              {t('welcome.howItWorks.title')}
            </h2>
            <div className="grid md:grid-cols-4 gap-10">
              {steps.map((step, idx) => (
                <div key={idx} className="relative text-center animate-fade-in-up" style={{ animationDelay: `${idx * 150}ms` }}>
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${gradients.accent} rounded-full text-text-on-primary font-bold text-2xl mb-4 shadow-lg`}>
                    {step.step}
                  </div>
                  <step.icon className="w-10 h-10 mx-auto mb-3 text-[var(--color-icon-accent-fg)]" />
                  <h3 className={`${typography.h4} text-text-primary mb-3`}>{step.title}</h3>
                  <p className={`${typography.bodySmall} text-text-muted`}>{step.desc}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card variant="elevated" className={`${gradients.primary} text-text-on-primary shadow-2xl`}>
          <CardBody className="text-center">
            <h2 className={`${typography.h2} mb-4 text-text-primary`}>
              {t('welcome.finalCTA.title')}
            </h2>
            <p className={`${typography.bodyLarge} mb-10 opacity-90 max-w-2xl mx-auto`}>
              {t('welcome.finalCTA.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                onClick={() => router.push('/auth/register')}
                size="lg"
                className="shadow-xl hover:shadow-2xl bg-background text-primary hover:bg-surface font-semibold"
              >
                {t('welcome.getStartedFree')}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/auth/login')}
                size="lg"
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
