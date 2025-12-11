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

export default function SettingsPage() {
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || "he";
  const t = useTranslations("settings");
  const { theme } = useThemeStore();
  const { showWarning } = useNotification();
  // React Query mutations and queries
  const logoutMutation = useLogout();
  const deleteAccountMutation = useDeleteAccount();
  const updateProfileMutation = useUpdateProfile();
  const updatePreferencesMutation = useUpdatePreferences();
  const updateNotificationSettingsMutation = useUpdateNotificationSettings();

  // Use preferences from user data instead of separate API call
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
    setTheme(data.theme as any);
    
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

  // Redirect logic - only redirect when needed
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(`/${locale}/welcome`);
    }
  }, [isAuthenticated, isInitialized, locale, router]);

  // Show loading while auth is initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 safe-area-inset flex items-center justify-center">
        <Card variant="glass" className="bg-white/80 shadow-2xl max-w-md">
          <CardBody className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text-muted">{t("loading")}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Don't render settings page for unauthenticated users
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
    {
      title: t("email"),
      description: t("emailDescription"),
      icon: Mail,
      color: "secondary",
      items: [
        {
          label: t("email"),
          value: user?.email || "",
          icon: Mail,
          type: "text" as const,
        },
      ],
    },
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
    <>

    <div className="min-h-screen bg-surface safe-area-inset"> {/* Set RTL on the main container */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* 1. Modern Header (Cleaner, Less Gradient Noise) */}
          <div className="text-center mb-8 pt-4">
            <div className="p-3 bg-gradient-to-br from-primaryT-400 to-primaryT-600 rounded-full w-fit mx-auto mb-3 shadow-lg">
              <Settings className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold">
              {t("settings")}
            </h1>
            <p className="text-text-muted mt-1">
              {t("manageAccountAndPreferences")}
            </p>
          </div>

          {/* 2. Settings Sections */}
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
                  className="bg-surface shadow-lg border border-border" // Simpler white card
                >
                  <CardBody className="p-0">
                    
                    {/* Section Title Bar (New, simpler look) */}
                    <div className="flex items-center gap-3 p-4 border-b border-border bg-card rounded-t-xl">
                      <Icon className={`w-5 h-5 ${accentColor}`} />
                      <h2 className="text-lg font-bold">
                        {section.title}
                      </h2>
                      <p className="text-sm text-text-muted mr-2 hidden sm:block">
                        - {section.description}
                      </p>
                    </div>

                    {/* Section Items */}
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
                              {/* Current Value Display */}
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

            {/* 3. Danger Zone (More clearly separated and action-differentiated) */}
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
                  {/* Logout: Less visually destructive, more like a utility action */}
                  <Button // Use a neutral color for Logout
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="flex-1 justify-center border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700"
                  >
                    <LogOut className="w-4 h-4 ml-2" />
                    {logoutMutation.isPending ? t("loggingOut") : t("logout")}
                  </Button>

                  {/* Delete Account: Primary Destructive Action */}
                  <Button
                    variant="destructive" // Use the strong red color
                    onClick={handleDeleteAccount}
                    disabled={deleteAccountMutation.isPending}
                    className="flex-1 justify-center"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
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

            {/* Edit Profile Modal */}
            <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        user={user}
        onSave={handleEditProfile}
        isLoading={updateProfileMutation.isPending}
      />

      {/* Update Email Modal */}
      <UpdateEmailModal
        isOpen={showUpdateEmailModal}
        onClose={() => setShowUpdateEmailModal(false)}
        currentEmail={user?.email || ""}
      />

      {/* Language & Theme Modal */}
      <LanguageThemeModal
        isOpen={showLanguageThemeModal}
        onClose={() => setShowLanguageThemeModal(false)}
        currentLocale={userPreferences?.language || locale}
        currentTheme={userPreferences?.darkMode ? 'dark' : theme}
        onSave={handleLanguageTheme}
        isLoading={updatePreferencesMutation.isPending}
      />

      {/* Notification Settings Modal */}
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
    </>
  );
}
//   return (
//     <div>
//           <div className="min-h-screen bg-surface safe-area-inset">
//       <div className="container mx-auto px-4 py-6">
//         <div className="max-w-4xl mx-auto space-y-6">
//           <div className="text-center mb-8">
//             <div className="p-3 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl w-fit mx-auto mb-4">
//               <Settings className="w-8 h-8 text-white" />
//             </div>
//             <h1 className="text-3xl font-bold text-primary mb-2">
//               {t("settings")}
//             </h1>
//             <p className="text-text-muted">
//               {t("manageAccountAndPreferences")}
//             </p>
//           </div>

//           {/* Settings Sections */}
//           <div className="grid gap-6">
//             {settingsSections.map((section) => {
//               const Icon = section.icon;
//               const colorClasses = {
//                 primary: "from-primary-400 to-primary-600",
//                 secondary: "from-secondary-400 to-secondary-600",
//                 accent: "from-accent-400 to-accent-600",
//                 success: "from-success-400 to-success-600",
//               };

//               return (
//                 <Card
//                   key={section.title}
//                   variant="glass"
//                   className="bg-white/80 shadow-xl"
//                 >
//                   <CardBody className="p-6">
//                     <div className="flex items-start gap-4 mb-6">
//                       {/* Icon */}
//                       <div
//                         className={`flex items-center justify-center p-3 rounded-xl bg-gradient-to-br ${
//                           colorClasses[
//                             section.color as keyof typeof colorClasses
//                           ]
//                         }`}
//                       >
//                         <Icon className="w-6 h-6 text-white" />
//                       </div>

//                       {/* Text */}
//                       <div className="flex flex-col min-w-0">
//                         <h2 className="text-lg font-semibold text-primary leading-snug">
//                           {section.title}
//                         </h2>
//                         <p className="text-sm text-text-muted leading-relaxed line-clamp-2">
//                           {section.description}
//                         </p>
//                       </div>
//                     </div>

//                     <div className="space-y-3">
//                       {section.items.map((item) => {
//                         const ItemIcon = item.icon;
//                         return (
//                           <button
//                             key={item.label}
//                             onClick={() => {
//                               if (item.type === "text") {
//                                 if (item.label === t("fullName")) {
//                                   setShowEditProfileModal(true);
//                                 } else if (item.label === t("email")) {
//                                   setShowUpdateEmailModal(true);
//                                 } else if (item.label === t("username")) {
//                                   // Username editing not implemented yet
//                                   showWarning("settings.usernameEditNotAvailable");
//                                 }
//                               } else if (item.type === "select") {
//                                 if (
//                                   item.label === t("language") ||
//                                   item.label === t("theme")
//                                 ) {
//                                   setShowLanguageThemeModal(true);
//                                 }
//                               } else if (item.type === "toggle") {
//                                 if (
//                                   item.label === t("pushNotifications") ||
//                                   item.label === t("emailNotifications")
//                                 ) {
//                                   setShowNotificationModal(true);
//                                 }
//                               }
//                             }}
//                             className="w-full flex items-center justify-between p-4 rounded-xl bg-white/50 hover:bg-white/70 transition-all duration-200 text-left"
//                           >
//                             <div className="flex items-center gap-3">
//                               <div className="p-2 bg-primary/10 rounded-lg">
//                                 <ItemIcon className="w-4 h-4 text-primary" />
//                               </div>
//                               <div>
//                                 <span className="text-text-primary font-medium">
//                                   {item.label}
//                                 </span>
//                                 <p className="text-text-muted text-sm">
//                                   {item.value}
//                                 </p>
//                               </div>
//                             </div>
//                             <div className="flex items-center gap-2">
//                               {item.type === "toggle" && (
//                                 <Badge
//                                   variant={
//                                     item.value === t("enabled")
//                                       ? "success"
//                                       : "warning"
//                                   }
//                                   size="sm"
//                                 >
//                                   {item.value}
//                                 </Badge>
//                               )}
//                               <ChevronRight className="w-4 h-4 text-text-muted" />
//                             </div>
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </CardBody>
//                 </Card>
//               );
//             })}

//             {/* Danger Zone */}
//             <Card
//               variant="glass"
//               className="bg-white/80 shadow-xl border-l-4 border-error"
//             >
//               <CardBody className="p-6">
//                 <div className="flex items-center gap-4 mb-6">
//                   <div className="p-3 bg-gradient-to-br from-error-400 to-error-600 rounded-xl">
//                     <AlertTriangle className="w-6 h-6 text-white" />
//                   </div>
//                   <div>
//                     <h2 className="text-xl font-bold text-error">
//                       {t("dangerZone")}
//                     </h2>
//                     <p className="text-text-muted text-sm">
//                       {t("dangerZoneDescription")}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex flex-col sm:flex-row gap-3">
//                   <Button
//                     variant="error"
//                     onClick={handleLogout}
//                     disabled={logoutMutation.isPending}
//                     className="flex-1 justify-between"
//                     icon={<LogOut className="w-4 h-4" />}
//                     iconPosition="right"
//                   >
//                     {logoutMutation.isPending ? t("loggingOut") : t("logout")}
//                   </Button>

//                   <Button
//                     variant="destructive"
//                     onClick={handleDeleteAccount}
//                     disabled={deleteAccountMutation.isPending}
//                     className="flex-1 justify-between"
//                     icon={<Trash2 className="w-4 h-4" />}
//                     iconPosition="right"
//                   >
//                     {deleteAccountMutation.isPending
//                       ? t("deletingAccount")
//                       : t("deleteAccount")}
//                   </Button>
//                 </div>
//               </CardBody>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//     </div>
//   );
// };