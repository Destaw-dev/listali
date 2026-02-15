import { z } from 'zod'

export const createLoginSchema = (t: (key: string) => string) => z.object({
  email: z.string().email(t('emailInvalid')),
  password: z.string().min(1, t('passwordRequired'))
});

export const createRegisterSchema = (t: (key: string) => string) => z.object({
  firstName: z.string().min(2, t('firstNameMinLength')),
  lastName: z.string().min(2, t('lastNameMinLength')),
  username: z.string().min(3, t('usernameMinLength')).regex(/^[a-zA-Z0-9._\-\u0590-\u05FF]+$/, t('usernameInvalid')),
  email: z.string().email(t('emailInvalid')),
  password: z.string()
    .min(12, t('passwordMinLength'))
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/, t('passwordComplexity')),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('passwordsDoNotMatch'),
  path: ['confirmPassword'],
});

export const createListSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(2, t('nameMinLength')).max(100, t('nameMaxLength')),
  description: z.string().max(500, t('descriptionMaxLength')).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium').optional(),
  tags: z.array(z.string()).optional(),
});


   export const itemSchema = (t: (key: string) => string) => z.object({
    name: z.string().min(1, t('nameRequired')).max(100, t('nameMaxLength')),
    quantity: z.number().min(0.1, t('quantityMin')).max(10000, t('quantityMax')),
    unit: z.string().min(1, t('unitRequired')).max(20, t('unitMaxLength')),
    category: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']),
    notes: z.string().max(500, t('notesMaxLength')).optional(),
    brand: z.string().max(100).optional(),
    description: z.string().max(200).optional(),
    product: z.string().optional(),
    image: z.string().optional(),  
  });
  
  export const itemsSchema = (t: (key: string) => string) => z.object({
    items: z.array(itemSchema(t)).min(1, t('atLeastOneItem')),
  });

  export const createProfileSchema = (t: (key: string) => string) => z.object({
    firstName: z
      .string()
      .min(2, t('firstNameMinLength'))
      .max(50, t('firstNameMaxLength'))
      .regex(/^[a-zA-Z\u0590-\u05FF\s]+$/, t('firstNameInvalid')),
    lastName: z
      .string()
      .min(2, t('lastNameMinLength'))
      .max(50, t('lastNameMaxLength'))
      .regex(/^[a-zA-Z\u0590-\u05FF\s]+$/, t('lastNameInvalid')),
    username: z
      .string()
      .min(3, t('usernameMinLength'))
      .max(30, t('usernameMaxLength'))
      .regex(/^[a-zA-Z0-9._\-\u0590-\u05FF]+$/, t('usernameInvalid')),
  });

  export const createEmailSchema = (t: (key: string) => string) => z.object({
    email: z
      .string()
      .min(1, t('emailRequired'))
      .email(t('invalidEmail'))
  });

export const createJoinGroupSchema = (t: (key: string) => string) => z.object({
  inviteCode: z.string().min(6, t('inviteCodeMinLength')).max(10, t('inviteCodeMaxLength')),
});

export const createInviteSchema = (t: (key: string) => string) => z.object({
  email: z.string().email(t('emailInvalid')),
  role: z.enum(['member', 'admin']),
});

export const createGroupSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(2, t('nameMinLength')).max(50, t('nameMaxLength')),
  description: z.string().max(200, t('descriptionMaxLength')).optional(),
});
