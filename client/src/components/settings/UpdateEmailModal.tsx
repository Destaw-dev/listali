import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { X, Mail } from 'lucide-react';
import { Button, Card, CardHeader, CardBody, Input } from '../common';
import { useUpdateEmail } from '../../hooks/useSettings';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { createEmailSchema } from '../../lib/schemas';

interface UpdateEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
}


export default function UpdateEmailModal({ isOpen, onClose, currentEmail }: UpdateEmailModalProps) {
  const t = useTranslations('settings');
  const emailSchema = createEmailSchema(t);
  type EmailInput = z.infer<typeof emailSchema>;
  const updateEmailMutation = useUpdateEmail();
  const [formData, setFormData] = useState<EmailInput>({ email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [internalIsLoading, setInternalIsLoading] = useState(false);

  const isLoading = updateEmailMutation.isPending || internalIsLoading;

  useEffect(() => {
    if (isOpen) {
      setFormData({ email: '' });
      setErrors({});
    }
  }, [isOpen]);

  const validateField = (field: keyof EmailInput, value: string) => {
    try {
      emailSchema.parse({ ...formData, [field]: value });
      setErrors(prev => ({ ...prev, [field]: '' }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.issues.find((e) => e.path.includes(field));
        if (fieldError) {
          setErrors(prev => ({ ...prev, [field]: t(fieldError.message) }));
        }
      }
    }
  };

  const handleInputChange = (field: keyof EmailInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(formData);
      setErrors({});
      
      setInternalIsLoading(true);
      await updateEmailMutation.mutateAsync({ email: formData.email });
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const field = err.path[0] as string;
          newErrors[field] = t(err.message);
        });
        setErrors(newErrors);
      }
    } finally {
      setInternalIsLoading(false);
    }
  };

  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-lg z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Card className="bg-surface shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-4">
        <CardHeader className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-xl">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">{t('updateEmail')}</h2>
              <p className="text-text-muted text-sm">{t('emailUpdateNote')}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            type="button"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <CardBody className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                {t('currentEmail')}
              </label>
              <Input
                value={currentEmail}
                disabled
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                {t('newEmail')}
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t('newEmailPlaceholder')}
                error={errors.email}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !formData.email || !!errors.email}
                className="flex-1"
                loading={isLoading}
              >
                {isLoading ? t('updating') : t('update')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
