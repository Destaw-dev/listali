"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import { useRouter, useParams, usePathname } from "next/navigation";
import {
  useLogout,
  useDeleteAccount,
  useUpdateProfile,
  useUpdatePreferences,
  useUpdateNotificationSettings,
} from "@/hooks/useSettings";
import { useThemeStore } from "@/store/themeStore";
import {
  Settings,
  User,
  Bell,
  LogOut,
  Trash2,
  ChevronRight,
  Globe,
  Palette,
  Mail,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import { Card, CardBody } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import EditProfileModal from "@/components/settings/EditProfileModal";
import UpdateEmailModal from "@/components/settings/UpdateEmailModal";
import LanguageThemeModal from "@/components/settings/LanguageThemeModal";
import NotificationModal from "@/components/settings/NotificationModal";
import { useNotification } from "@/contexts/NotificationContext";
import { Theme } from "@/types";

export default function SettingsPage() {
  const { user, isAuthenticated, isInitialized, } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || "he";
  const t = useTranslations("settings");
  const { theme } = useThemeStore();
  const { showWarning } = useNotification();
  const logoutMutation = useLogout();
  const deleteAccountMutation = useDeleteAccount();
  const updateProfileMutation = useUpdateProfile();
  const updatePreferencesMutation = useUpdatePreferences();
  const updateNotificationSettingsMutation = useUpdateNotificationSettings();

  const userPreferences = user?.preferences;

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showUpdateEmailModal, setShowUpdateEmailModal] = useState(false);
  const [showLanguageThemeModal, setShowLanguageThemeModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const handleLogout = async () => {
    logoutMutation.mutate();
  };

  const handleDeleteAccount = async () => {
    if (confirm(t("deleteAccountConfirmation"))) {
      deleteAccountMutation.mutate();
    }
  };

  const handleEditProfile = async (data: {
    firstName: string;
    lastName: string;
    username?: string;
  }) => {
    updateProfileMutation.mutate(data);
  };

  const handleLanguageTheme = async (data: {
    language: string;
    theme: string;
  }) => {
    await updatePreferencesMutation.mutateAsync(data);
    
    const { setTheme } = useThemeStore.getState();
    setTheme(data.theme as Theme);
    
    document.cookie = `NEXT_LOCALE=${data.language}; path=/; max-age=31536000; SameSite=Lax`;
    if (data.language !== locale) {
      const pathWithoutLocale = pathname.replace(`/${locale}`, '');
      window.location.href = `/${data.language}${pathWithoutLocale}`;
    }
  };

  const handleNotificationSettings = async (settings: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    newMessageNotifications: boolean;
    shoppingListUpdates: boolean;
    groupInvitations: boolean;
  }) => {
    await updateNotificationSettingsMutation.mutateAsync(settings);
  };

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(`/${locale}/welcome`);
    }
  }, [isAuthenticated, isInitialized, locale, router]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Card variant="glass" className="bg-white/80 shadow-2xl max-w-md">
          <CardBody className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text-muted">{t("loading")}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const settingsSections = [
    {
      title: t("account"),
      description: t("accountDescription"),
      icon: User,
      color: "primary",
      items: [
        {
          label: t("fullName"),
          value: `${user?.firstName} ${user?.lastName}`,
          icon: User,
          type: "text" as const,
        },
        {
          label: t("username"),
          value: user?.username || "",
          icon: User,
          type: "text" as const,
        },
      ],
    },
    // {
    //   title: t("email"),
    //   description: t("emailDescription"),
    //   icon: Mail,
    //   color: "secondary",
    //   items: [
    //     {
    //       label: t("email"),
    //       value: user?.email || "",
    //       icon: Mail,
    //       type: "text" as const,
    //     },
    //   ],
    // },
    {
      title: t("settings"),
      description: t("settingsDescription"),
      icon: Settings,
      color: "secondary",
      items: [
        {
          label: t("language"),
          value: locale === "he" ? t("hebrew") : t("english"),
          icon: Globe,
          type: "select" as const,
        },
        {
          label: t("theme"),
          value: t("automatic"),
          icon: Palette,
          type: "select" as const,
        },
      ],
    },
    {
      title: t("notifications"),
      description: t("notificationsDescription"),
      icon: Bell,
      color: "accent",
      items: [
        {
          label: t("pushNotifications"),
          value: user?.preferences?.pushNotifications ? t("enabled") : t("disabled"),
          icon: Smartphone,
          type: "toggle" as const,
        },
        {
          label: t("emailNotifications"),
          value: user?.preferences?.emailNotifications ? t("enabled") : t("disabled"),
          icon: Mail,
          type: "toggle" as const,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center mb-8 pt-4 ">
            <div className="flex items-center justify-center gap-3">

            <div className="p-3 bg-gradient-to-br from-primaryT-400 to-primaryT-600 rounded-full w-fit mb-3 shadow-lg">
              <Settings className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold">
              {t("settings")}
            </h1>
            </div>
            <p className="text-text-muted mt-1">
              {t("manageAccountAndPreferences")}
            </p>
          </div>

          <div className="grid gap-6">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              const accentColor = 
                section.color === 'primary' ? 'text-primaryT-500' : 
                section.color === 'secondary' ? 'text-secondaryT-500' : 
                'text-accent';

              return (
                <Card
                  key={section.title}
                  className="bg-surface shadow-lg border border-border" 
                >
                  <CardBody className="p-0">
                    
                    <div className="flex items-center gap-3 p-4 border-b border-border bg-card rounded-t-xl">
                      <Icon className={`w-5 h-5 ${accentColor}`} />
                      <h2 className="text-lg font-bold">
                        {section.title}
                      </h2>
                      <p className="text-sm text-text-muted mr-2 hidden sm:block">
                        - {section.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {section.items.map((item, index) => {
                        const ItemIcon = item.icon;
                        const isLastItem = index === section.items.length - 1;

                        return (
                          <div key={item.label} className="my-2">

                          <Button
                            variant="ghost"
                            size="lg"
                            key={item.label}
                            onClick={() => {
                              if (item.type === "text") {
                                if (item.label === t("fullName")) {
                                  setShowEditProfileModal(true);
                                } else if (item.label === t("email")) {
                                  setShowUpdateEmailModal(true);
                                } else if (item.label === t("username")) {
                                  showWarning("settings.usernameEditNotAvailable");
                                }
                              } else if (item.type === "select") {
                                if (
                                  item.label === t("language") ||
                                  item.label === t("theme")
                                ) {
                                  setShowLanguageThemeModal(true);
                                }
                              } else if (item.type === "toggle") {
                                if (
                                  item.label === t("pushNotifications") ||
                                  item.label === t("emailNotifications")
                                ) {
                                  setShowNotificationModal(true);
                                }
                              }
                            }}
                            fullWidth
                            className={` ${isLastItem ? 'rounded-b-xl' : ''} block text-start`}
                          >
                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={` rounded-lg ${accentColor} bg-opacity-10`}>
                                <ItemIcon className={`w-4 h-4 ${accentColor}`} />
                              </div>
                              <span className="font-medium">
                                {item.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {item.type === "toggle" && (
                                <Badge
                                  variant={
                                    item.value === t("enabled")
                                      ? "success"
                                      : "warning"
                                  }
                                  size="sm"
                                >
                                  {item.value}
                                </Badge>
                              )}
                              {item.type !== "toggle" && (
                                <span className="text-sm font-light">
                                  {item.value}
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4" />
                            </div>
                            </div>
                          </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardBody>
                </Card>
              );
            })}

            <Card
              className="bg-white shadow-lg border-2 border-error-100"
            >
              <CardBody className="p-6">
                <div className="flex items-start gap-4 mb-6 border-b pb-4 border-error-100">
                  <div className="p-3 bg-error-500 rounded-xl shadow-lg">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-error-600">
                      {t("dangerZone")}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      {t("dangerZoneDescription")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Button variant="primary" onClick={handleLogout} disabled={logoutMutation.isPending} icon={<LogOut className="w-4 h-4" />} fullWidth size="lg">
                    {logoutMutation.isPending ? t("loggingOut") : t("logout")}
                  </Button>

                  <Button
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    disabled={deleteAccountMutation.isPending}
                    size="lg"
                    fullWidth
                    icon={<Trash2 className="w-4 h-4" />}
                  >
                    {deleteAccountMutation.isPending
                      ? t("deletingAccount")
                      : t("deleteAccount")}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

            <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        user={user}
        onSave={handleEditProfile}
        isLoading={updateProfileMutation.isPending}
      />

      <UpdateEmailModal
        isOpen={showUpdateEmailModal}
        onClose={() => setShowUpdateEmailModal(false)}
        currentEmail={user?.email || ""}
      />

      <LanguageThemeModal
        isOpen={showLanguageThemeModal}
        onClose={() => setShowLanguageThemeModal(false)}
        currentLocale={userPreferences?.language || locale}
        currentTheme={userPreferences?.darkMode ? 'dark' : theme}
        onSave={handleLanguageTheme}
        isLoading={updatePreferencesMutation.isPending}
      />

      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        currentSettings={{
          pushNotifications: user?.preferences?.pushNotifications || false,
          emailNotifications: user?.preferences?.emailNotifications || false,
          newMessageNotifications: user?.preferences?.newMessageNotifications || false,
          shoppingListUpdates: user?.preferences?.shoppingListUpdates || false,
          groupInvitations: user?.preferences?.groupInvitations || false,
        }}
        onSave={handleNotificationSettings}
        isLoading={updateNotificationSettingsMutation.isPending}
      />
      
    </div>
  );
}
