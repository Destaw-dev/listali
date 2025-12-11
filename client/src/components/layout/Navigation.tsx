'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Home, Users, Settings, LogOut, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { useLogout } from '@/hooks/useSettings';
import { Button } from '../common/Button';

export function Navigation() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = params?.locale as string || 'he';
  const t = useTranslations('navigation');
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    if (confirm(t('logoutConfirmation'))) {
      logoutMutation.mutate();
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    {
      label: t('home'),
      icon: Home,
      href: `/${locale}/dashboard`,
      active: pathname === `/${locale}/dashboard`,
    },
    {
      label: t('groups'),
      icon: Users,
      href: `/${locale}/groups`,
      active: pathname.startsWith(`/${locale}/groups`),
    },
    {
      label: t('invitations'),
      icon: UserPlus,
      href: `/${locale}/invitations`,
      active: pathname === `/${locale}/invitations`,
    },
    {
      label: t('settings'),
      icon: Settings,
      href: `/${locale}/settings`,
      active: pathname === `/${locale}/settings`,
    },
  ];

  return (
    <>
      {/* Desktop Navigation - Top */}
      <nav className="hidden md:block bg-gradient-to-r from-white/95 via-white/90 to-white/95 dark:from-neutral-900/95 dark:via-neutral-800/90 dark:to-neutral-900/95 backdrop-blur-xl  shadow-lg">
        <div className="px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary">Smart Lists</h1>
                <p className="text-xs text-secondary">Group Shopping</p>
              </div>
            </div>

            {/* Desktop Navigation Items */}
            <div className="flex items-center gap-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    variant={item.active ? 'primary' : 'ghost'}
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    icon={<Icon className="w-5 h-5" />}
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Desktop User Menu */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <div className="flex items-center gap-0.5">

              {/* <div>
                <p className="text-sm font-semibold text-primary">
                  {user?.username || user?.firstName + ' ' + user?.lastName}
                </p>
                <p className="text-xs text-secondary truncate max-w-32">
                  {user?.email}
                </p>
              </div> */}
              
              {user?.avatar ? (
                <div>
                  <img
                    src={user.avatar}
                    alt={(user.username || user.firstName) + ' avatar'}
                    className="w-10 h-10 rounded-full border-2 border-primary/30 shadow-lg hover:border-primary/60 transition-all duration-300 hover:scale-110"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 flex items-center justify-center shadow-lg">
                  <span className="text-primary font-bold text-sm">
                    {(user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
              )}
              </div>
              


              <Button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                variant="ghost"
                size="sm"
                rounded={true}
              >
                {logoutMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-white/95 via-white/90 to-white/95 dark:from-neutral-900/95 dark:via-neutral-800/90 dark:to-neutral-900/95 backdrop-blur-xl safe-area-inset-bottom shadow-2xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* Mobile Navigation Items */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    variant={item.active ? 'primary' : 'ghost'}
                    size='sm'
                    >
                      <div className="flex items-center flex-col">

                    <Icon className="w-5 h-5" />
                    <p className="text-xs font-medium">{item.label}</p>
                      </div>
                  </Button>
                );
              })}
            </div>

            {/* Mobile User Menu */}
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={(user.username || user.firstName) + ' avatar'}
                  className="w-8 h-8 rounded-full border-2 border-primary/30 shadow-md"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 flex items-center justify-center">
                  <span className="text-primary font-bold text-xs">
                    {(user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
              )}

              <Button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                variant="ghost"
                size='xs'
                rounded={true}
                >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
} 