'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../../store/authStore';
import { useGuestListsStore } from '../../../store/guestListsStore';
import { useStorageMonitor } from '../../../hooks/useStorageMonitor';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import { CreateGuestListModal } from '../../../components/guestList/CreateGuestListModal';
import { StorageWarningModal } from '../../../components/guestList/StorageWarningModal';
import { Card, CardBody, CardHeader, Button, Badge, SkeletonCard } from '../../../components/common';
import { ShoppingCart, Activity } from 'lucide-react';
import { useRouter } from '../../../i18n/navigation';
import { useAuthRedirect } from '../../../hooks/useAuthRedirect';

export default function GuestDashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const { isGuest } = useAuthStore();
  const { lists: guestLists } = useGuestListsStore();
  const { requireAuth, RequireAuthModal } = useRequireAuth();
  const [showCreateGuestListModal, setShowCreateGuestListModal] = useState(false);
  const { checkStorage } = useStorageMonitor();
  const [showStorageWarning, setShowStorageWarning] = useState(false);

  const { safeToShow } = useAuthRedirect({
    redirectTo: '/welcome',
    requireAuth: false,
  });

  if (!safeToShow) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Hero card skeleton */}
            <SkeletonCard />

            {/* Metric cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>

            {/* Lists section skeleton */}
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (!isGuest()) {
    return null;
  }

  const totalGuestItems = guestLists.reduce(
      (sum, list) => sum + list.items.length,
      0
    );
  const checkedGuestItems = guestLists.reduce(
    (sum, list) => sum + list.items.filter((item) => item.checked).length,
    0
  );

  return (
    <div className="min-h-screen bg-surface">
        {RequireAuthModal}
        <CreateGuestListModal
          isOpen={showCreateGuestListModal}
          onClose={() => setShowCreateGuestListModal(false)}
        />
        <StorageWarningModal
          isOpen={showStorageWarning}
          onClose={() => {
            setShowStorageWarning(false);
            checkStorage();
          }}
        />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            <Card variant="glass" className="shadow-2xl bg-card">
              <CardBody className="p-1 sm:p-8">
                <div className="flex sm:items-center justify-between flex-col md:flex-row gap-3">
                  <div>
                    <h1 className="text-4xl font-bold text-text-primary mb-2">
                      {t('Dashboard.welcome')}
                    </h1>
                    <p className="text-xl text-secondary font-medium mb-1">
                      {t('Dashboard.guestMode')}
                    </p>
                    <p className="text-sm text-text-muted">
                      {t('Dashboard.guestModeDesc')}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (!requireAuth("login")) {
                      }
                    }}
                  >
                    {t('Dashboard.login')}
                  </Button>
                </div>
              </CardBody>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card hover className="bg-card">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-[var(--color-icon-secondary-bg)] rounded-2xl shadow-sm">
                      <ShoppingCart className="w-6 h-6 text-[var(--color-icon-secondary-fg)]" />
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-medium text-text-muted">
                        {t('Dashboard.totalLists')}
                      </p>
                      <p className="text-2xl font-bold text-secondary">
                        {guestLists.length}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card hover className="bg-card">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-[var(--color-icon-success-bg)] rounded-2xl shadow-sm">
                      <Activity className="w-6 h-6 text-[var(--color-icon-success-fg)]" />
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-medium text-text-muted">
                        {t('Dashboard.checkedItems')}
                      </p>
                      <p className="text-2xl font-bold text-success">
                        {checkedGuestItems}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card hover className="bg-card">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-[var(--color-icon-info-bg)] rounded-2xl shadow-sm">
                      <ShoppingCart className="w-6 h-6 text-[var(--color-icon-info-fg)]" />
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-medium text-text-muted">
                        {t('Dashboard.totalItems')}
                      </p>
                      <p className="text-2xl font-bold text-info">
                        {totalGuestItems}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            <Card variant="glass" className="bg-surface/80 shadow-2xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--color-icon-primary-bg)] rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-[var(--color-icon-primary-fg)]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">
                      {t('Dashboard.myLists')}
                    </h2>
                    <p className="text-text-muted">
                      {t('Dashboard.guestListsDesc')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {guestLists.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-4 bg-[var(--color-icon-primary-bg)] rounded-2xl mx-auto w-fit mb-4">
                      <ShoppingCart className="w-8 h-8 text-[var(--color-icon-primary-fg)]" />
                    </div>
                    <p className="text-text-muted mb-4">
                      {t('Dashboard.noGuestLists')}
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => setShowCreateGuestListModal(true)}
                      className="mx-auto"
                    >
                      {t('Dashboard.createList')}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {guestLists.map((list) => (
                      <Card
                        key={list.id}
                        variant="glass"
                        hover
                        className="cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={() =>
                          router.push(`/guest-lists/${list.id}`)
                        }
                      >
                        <CardBody className="p-4">
                          <h3 className="text-lg font-semibold text-text-primary mb-2">
                            {list.title}
                          </h3>
                          <p className="text-sm text-text-muted mb-4">
                            {list.items.length} {t('Dashboard.items')}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-text-muted">
                              {list.items.filter((i) => i.checked).length}/
                              {list.items.length} {t('Dashboard.checked')}
                            </span>
                            <Badge variant="secondary" size="sm">
                              {t('Dashboard.local')}
                            </Badge>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    );
  }
