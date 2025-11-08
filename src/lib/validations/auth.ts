import { z } from 'zod';
import i18n from '@/i18n/config';

export const signInSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: i18n.t('validation:invalidEmail') })
    .max(255, { message: i18n.t('validation:maxLength', { field: 'Email', max: 255 }) }),
  password: z.string()
    .min(6, { message: i18n.t('validation:minLength', { field: 'Password', min: 6 }) })
    .max(72, { message: i18n.t('validation:maxLength', { field: 'Password', max: 72 }) })
});

export const signUpSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, { message: i18n.t('validation:minLength', { field: 'Name', min: 2 }) })
    .max(100, { message: i18n.t('validation:maxLength', { field: 'Name', max: 100 }) }),
  email: z.string()
    .trim()
    .email({ message: i18n.t('validation:invalidEmail') })
    .max(255, { message: i18n.t('validation:maxLength', { field: 'Email', max: 255 }) }),
  password: z.string()
    .min(6, { message: i18n.t('validation:minLength', { field: 'Password', min: 6 }) })
    .max(72, { message: i18n.t('validation:maxLength', { field: 'Password', max: 72 }) })
});

export const passwordResetSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: i18n.t('validation:invalidEmail') })
    .max(255, { message: i18n.t('validation:maxLength', { field: 'Email', max: 255 }) })
});

export const updatePasswordSchema = z.object({
  password: z.string()
    .min(6, { message: i18n.t('validation:minLength', { field: 'Password', min: 6 }) })
    .max(72, { message: i18n.t('validation:maxLength', { field: 'Password', max: 72 }) }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: i18n.t('validation:passwordMismatch'),
  path: ["confirmPassword"],
});

export const profileSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, { message: i18n.t('validation:minLength', { field: 'Name', min: 2 }) })
    .max(100, { message: i18n.t('validation:maxLength', { field: 'Name', max: 100 }) }),
  phone: z.string()
    .trim()
    .max(20, { message: i18n.t('validation:maxLength', { field: 'Phone', max: 20 }) })
    .optional()
    .or(z.literal('')),
  specialization: z.string()
    .trim()
    .max(100, { message: i18n.t('validation:maxLength', { field: 'Specialization', max: 100 }) })
    .optional()
    .or(z.literal('')),
  licenseNumber: z.string()
    .trim()
    .max(50, { message: i18n.t('validation:maxLength', { field: 'License number', max: 50 }) })
    .optional()
    .or(z.literal(''))
});

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
