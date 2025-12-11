import { z } from 'zod'

// Login Schema
export const loginSchema = z.object({
    email: z
    .string()
    .email('כתובת אימייל לא תקינה')
    .max(255, 'כתובת אימייל ארוכה מדי'),
  password: z
    .string()
    .min(8, 'סיסמה חייבת להכיל לפחות 8 תווים')
    .max(100, 'סיסמה לא יכולה להכיל יותר מ-100 תווים'),
})

// סכמת ולידציה
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "נדרש שם פרטי")
      .min(2, "שם פרטי חייב להכיל לפחות 2 תווים"),
    lastName: z
      .string()
      .min(1, "נדרש שם משפחה")
      .min(2, "שם משפחה חייב להכיל לפחות 2 תווים"),
    username: z
      .string()
      .min(1, "נדרש שם משתמש")
      .min(3, "שם משתמש חייב להכיל לפחות 3 תווים")
      .regex(
        /^[a-zA-Z0-9_\u0590-\u05FF]+$/,
        "שם משתמש יכול להכיל רק אותיות, מספרים וקו תחתון"
      ),
    email: z.string().min(1, "נדרש מייל").email("כתובת מייל לא תקינה"),
    password: z
      .string()
      .min(1, "נדרשת סיסמה")
      .min(6, "הסיסמה חייבת להכיל לפחות 6 תווים")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "הסיסמה חייבת להכיל אות קטנה, אות גדולה ומספר"
      ),
    confirmPassword: z.string().min(1, "נדרש אישור סיסמה"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "הסיסמאות לא תואמות",
    path: ["confirmPassword"],
  });

// Group Schema
export const groupSchema = z.object({
  name: z
    .string()
    .min(2, 'שם קבוצה חייב להכיל לפחות 2 תווים')
    .max(50, 'שם קבוצה לא יכול להכיל יותר מ-50 תווים'),
  description: z
    .string()
    .max(200, 'תיאור לא יכול להכיל יותר מ-200 תווים')
    .optional(),
})

// Shopping List Schema
export const shoppingListSchema = z.object({
  name: z
    .string()
    .min(2, 'שם רשימה חייב להכיל לפחות 2 תווים')
    .max(100, 'שם רשימה לא יכול להכיל יותר מ-100 תווים'),
  groupId: z.string().min(1, 'חובה לבחור קבוצה'),
})

// Shopping Item Schema
export const shoppingItemSchema = z.object({
  name: z
    .string()
    .min(1, 'שם פריט חובה')
    .max(100, 'שם פריט לא יכול להכיל יותר מ-100 תווים'),
  description: z
    .string()
    .max(200, 'תיאור לא יכול להכיל יותר מ-200 תווים')
    .optional(),
  quantity: z
    .number()
    .min(1, 'כמות חייבת להיות לפחות 1')
    .max(999, 'כמות לא יכולה להיות יותר מ-999'),
  unit: z
    .string()
    .max(20, 'יחידה לא יכולה להכיל יותר מ-20 תווים')
    .optional(),
  category: z
    .string()
    .max(50, 'קטגוריה לא יכולה להכיל יותר מ-50 תווים')
    .optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
})

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type GroupInput = z.infer<typeof groupSchema>
export type ShoppingListInput = z.infer<typeof shoppingListSchema>
export type ShoppingItemInput = z.infer<typeof shoppingItemSchema>