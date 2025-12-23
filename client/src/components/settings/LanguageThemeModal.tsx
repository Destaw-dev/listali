'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Globe, Palette, Check } from 'lucide-react';
import { Card, CardBody } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useNotification } from '@/contexts/NotificationContext';

interface LanguageThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocale: string;
  currentTheme: string;
  onSave: (data: { language: string; theme: string }) => Promise<void>;
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
  const { showSuccess, handleApiError } = useNotification();
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const isLoading = externalIsLoading || internalIsLoading;
  const [selectedLanguage, setSelectedLanguage] = useState(currentLocale);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);

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
      handleApiError(error);
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-lg z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card  className="bg-surface shadow-2xl max-w-lg w-full animate-in slide-in-from-bottom-4">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primaryT-400 to-primaryT-600 rounded-xl">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">{t('languageAndTheme')}</h2>
                <p className="text-text-muted text-sm">{t('customizeYourExperience')}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" onKeyDown={handleKeyDown}>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
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
              <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
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
                    onClick={() => setSelectedTheme(theme.id)}
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

            <div className=" w-full h-1 bg-gradient-to-r from-primaryT-100 to-primaryT-200" />

            <div className="flex gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
                type="button"
              >
                {t('cancel')}
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="flex-1"
                loading={isLoading}
              >
                {isLoading ? t('saving') : t('save')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
