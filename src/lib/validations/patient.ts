import { z } from 'zod';

export const patientSchema = z.object({
  full_name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .trim()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number format')
    .max(20, 'Phone number must be less than 20 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
  date_of_birth: z.string()
    .nullable()
    .optional(),
  medical_history: z.string()
    .max(5000, 'Medical history must be less than 5000 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
  allergies: z.string()
    .max(2000, 'Allergies list must be less than 2000 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
  email_consent: z.boolean().default(false)
});

export type PatientFormData = z.infer<typeof patientSchema>;
