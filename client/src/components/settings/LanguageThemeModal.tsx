'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Globe, Palette, Check } from 'lucide-react';
import { Button, Modal } from '../common';
import { useNotification } from '../../contexts/NotificationContext';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { Theme } from '../../types';

interface LanguageThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocale: string;
  currentTheme: Theme;
  onSave: (data: { language: string; theme: Theme }) => Promise<void>;
  isLoading?: boolean;
}

const languages = [
  { code: 'he', name: 'עברית', flag: '🇮🇱' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

const themes = [
  { id: 'light', name: 'light', icon: '☀️', description: 'lightTheme' },
  { id: 'dark', name: 'dark', icon: '🌙', description: 'darkTheme' },
  { id: 'system', name: 'automatic', icon: '🖥️', description: 'systemTheme' },
];

export default function LanguageThemeModal({ 
  isOpen, 
  onClose, 
  currentLocale, 
  currentTheme, 
  onSave,
  isLoading: externalIsLoading
}: LanguageThemeModalProps) {
  const t = useTranslations('settings');

  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLocale);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  
  const { showSuccess, handleApiError } = useNotification();
  const isLoading = externalIsLoading || internalIsLoading;

  useEffect(() => {
    if (isOpen) {
      setSelectedLanguage(currentLocale);
      setSelectedTheme(currentTheme);
    }
  }, [isOpen, currentLocale, currentTheme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedLanguage === currentLocale && selectedTheme === currentTheme) {
      onClose();
      return;
    }

    setInternalIsLoading(true);
    
    try {
      await onSave({ language: selectedLanguage, theme: selectedTheme });
      localStorage.setItem('preferredLanguage', selectedLanguage);
      showSuccess('settings.preferencesUpdateSuccess');
      onClose();
    } catch (error) {
      console.error('Preferences update error:', error);
      if (error instanceof Error) {
        handleApiError(error);
      }
    } finally {
      setInternalIsLoading(false);
    }
  };

  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <Modal
      title={t("languageAndTheme")}
      onClose={onClose}
      iconHeader={<div className=" p-2 bg-[var(--color-icon-primary-bg)] rounded-full">
        <Globe className="w-5 h-5 text-[var(--color-icon-primary-fg)]" />
      </div>}
      subtitle={t("customizeYourExperience")}
      size="md"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('language')}
              </h3>
              <div className="grid gap-2.5">
                {languages.map((lang) => (
                  <Button
                    key={lang.code}
                    type="button"
                    fullWidth={true}
                    size='lg'
                    variant={selectedLanguage === lang.code ? 'primary' : 'ghost'}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className='text-start p-0 block'
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <div>
                          <span className="font-medium text-text-primary">{lang.name}</span>
                        </div>
                      </div>
                      {selectedLanguage === lang.code && (
                        <Check className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                {t('theme')}
              </h3>
              <div className="grid gap-2.5">
                {themes.map((theme) => (
                  <Button
                    key={theme.id}
                    type="button"
                    fullWidth={true}
                    size='lg'
                    onClick={() => setSelectedTheme(theme.id as Theme)}
                    variant={selectedTheme === theme.id ? 'primary' : 'ghost'}
                    className='text-start p-0 block'
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{theme.icon}</span>
                        <div>
                          <span className="font-medium text-text-primary">{t(theme.name)}</span>
                          <p className="text-text-muted text-sm">{t(theme.description)}</p>
                        </div>
                      </div>
                      {selectedTheme === theme.id && (
                        <Check className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-border" />

            <div className="flex gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={onClose}
                fullWidth
                disabled={isLoading}
                type="button"
              >
                {t('cancel')}
              </Button>
              <Button
                variant="primary"
                type="submit"
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? t('saving') : t('save')}
              </Button>
            </div>
          </form>
    </Modal>
  )
}
