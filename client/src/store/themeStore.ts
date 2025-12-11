import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, ThemeStore } from '@/types';
import { apiClient } from '@/lib/api';

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',

      setTheme: (theme: Theme) => {
        set({ theme });
      },

      updateThemeOnServer: async (theme: Theme) => {
        try {
          await apiClient.updatePreferences({ 
            language: 'he', // Keep current language
            theme: theme 
          });
        } catch (error) {
          console.error('Error updating theme on server:', error);
          // Theme update error - this will be handled by the notification system
        }
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        let newTheme: Theme;

        if (currentTheme === 'light') {
          newTheme = 'dark';
        } else if (currentTheme === 'dark') {
          newTheme = 'system';
        } else {
          newTheme = 'light';
        }

        get().setTheme(newTheme);
        // Update on server in background
        get().updateThemeOnServer(newTheme);
      },
    }),
    {
      name: 'theme-store',
    }
  )
);

// Theme application is now handled by ThemeProvider component