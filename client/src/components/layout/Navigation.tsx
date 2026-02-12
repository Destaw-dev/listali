'use client';

import { useAuthStore } from '../../store/authStore';
import { useRouter, usePathname } from '../../i18n/navigation';
import { Home, Users, Settings, LogOut, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { useLogout } from '../../hooks/useSettings';
import { Button } from '../common';
import Image from 'next/image';
import { iconSizes } from '../../lib/iconSizes';

export function Navigation() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
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
      href: '/dashboard',
      active: pathname === '/dashboard',
      showOnMobile: true,
    },
    {
      label: t('groups'),
      icon: Users,
      href: '/groups',
      active: pathname.startsWith('/groups'),
      showOnMobile: true,
    },
    {
      label: t('invitations'),
      icon: UserPlus,
      href: '/invitations',
      active: pathname === '/invitations',
      showOnMobile: true,
    },
    {
      label: t('settings'),
      icon: Settings,
      href: '/settings',
      active: pathname === '/settings',
      showOnMobile: true,
    },
  ];

  return (
    <>
      <nav className="hidden md:block bg-background shadow-md text-text-primary">
          <div className="flex items-center justify-around p-4">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => router.push('/dashboard')}
            >
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">Listali</h1>
            </div>

            <div className="flex items-center gap-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    variant={item.active ? 'primary' : 'ghost'}
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    icon={<Icon className={iconSizes.md} />}
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                  </Button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <div className="flex items-center gap-0.5">
              
              {user?.avatar ? (
                <div>
                  <Image
                    width={40}
                    height={40}
                    loading="lazy"
                    src={user.avatar}
                    alt={(user.username || user.firstName) + ' avatar'}
                    className="rounded-full border-2 border-primary/30 shadow-lg hover:border-primary/60 transition-all duration-300 hover:scale-110"
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
                  <div className={`${iconSizes.md} border-2 border-current border-t-transparent rounded-full animate-spin`} />
                ) : (
                  <LogOut className={iconSizes.md} />
                )}
              </Button>
            </div>
          </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background shadow-2xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                if (!item.showOnMobile) return null;
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    variant={item.active ? 'primary' : 'ghost'}
                    size='sm'
                    >
                      <div className="flex items-center flex-col">

                    <Icon className={iconSizes.md} />
                    <p className="text-xs font-medium">{item.label}</p>
                      </div>
                  </Button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {user?.avatar ? (
                <Image
                  loading="lazy"
                  src={user.avatar}
                  alt={(user.username || user.firstName) + ' avatar'}
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-primary/30 shadow-md"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-text-primary flex items-center justify-center">
                  <span className="text-text-primary font-bold text-xs">
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
                <LogOut className={iconSizes.md} />
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
} 