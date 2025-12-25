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
            language: 'he',
            theme: theme 
          });
        } catch (error) {
          console.error('Error updating theme on server:', error);
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

        set({ theme: newTheme });
        const updateThemeOnServer = get().updateThemeOnServer;
        if (updateThemeOnServer) {
          updateThemeOnServer(newTheme);
        }
      },
    }),
    {
      name: 'theme-store',
    }
  )
);
