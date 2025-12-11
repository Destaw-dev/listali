import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { X, Mail } from 'lucide-react';
import { Button, Card, CardHeader, CardBody, Input } from '@/components/common';
import { useUpdateEmail } from '@/hooks/useSettings';

interface UpdateEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
}

const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'emailRequired')
    .email('invalidEmail')
});

type EmailFormData = z.infer<typeof emailSchema>;

export default function UpdateEmailModal({ isOpen, onClose, currentEmail }: UpdateEmailModalProps) {
  const t = useTranslations('settings');
  const updateEmailMutation = useUpdateEmail();
  const [formData, setFormData] = useState<EmailFormData>({ email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [internalIsLoading, setInternalIsLoading] = useState(false);

  const isLoading = updateEmailMutation.isPending || internalIsLoading;

  useEffect(() => {
    if (isOpen) {
      setFormData({ email: '' });
      setErrors({});
    }
  }, [isOpen]);

  const validateField = (field: keyof EmailFormData, value: string) => {
    try {
      emailSchema.parse({ ...formData, [field]: value });
      setErrors(prev => ({ ...prev, [field]: '' }));
    } catch (error) {
      const zodError = error as any;
      const fieldError = zodError.errors.find((e: any) => e.path.includes(field));
      if (fieldError) {
        setErrors(prev => ({ ...prev, [field]: t(fieldError.message) }));
      }
    }
  };

  const handleInputChange = (field: keyof EmailFormData, value: string) => {
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
      const zodError = error as any;
      if (zodError.errors) {
        const newErrors: Record<string, string> = {};
        zodError.errors.forEach((err: any) => {
          const field = err.path[0];
          newErrors[field] = t(err.message);
        });
        setErrors(newErrors);
      }
    } finally {
      setInternalIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/50 backdrop-blur-sm">
      <Card variant="glass" className="bg-white/90 shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-4">
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
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-white/50"
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
