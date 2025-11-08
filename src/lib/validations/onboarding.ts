import { z } from 'zod';

// Patient onboarding validation schema
export const patientOnboardingSchema = z.object({
  phone: z.string()
    .trim()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number format')
    .max(20, 'Phone number must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  date_of_birth: z.string()
    .optional(),
  medical_history: z.string()
    .max(5000, 'Medical history must be less than 5000 characters')
    .optional()
    .or(z.literal('')),
  allergies: z.string()
    .max(2000, 'Allergies list must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
  email_consent: z.boolean().default(false)
});

// Practitioner onboarding validation schema
export const practitionerOnboardingSchema = z.object({
  phone: z.string()
    .trim()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number format')
    .max(20, 'Phone number must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  specialization: z.string()
    .max(100, 'Specialization must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  license_number: z.string()
    .max(50, 'License number must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  practice_name: z.string()
    .max(200, 'Practice name must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  years_of_experience: z.number()
    .min(0, 'Years of experience cannot be negative')
    .max(70, 'Years of experience cannot exceed 70')
    .optional()
    .or(z.literal(null)),
  bio: z.string()
    .max(1000, 'Bio must be less than 1000 characters')
    .optional()
    .or(z.literal(''))
});

export type PatientOnboardingFormData = z.infer<typeof patientOnboardingSchema>;
export type PractitionerOnboardingFormData = z.infer<typeof practitionerOnboardingSchema>;
