import { z } from 'zod';

export const recommendationSchema = z.object({
  practitioner_id: z.string().uuid('Invalid practitioner ID'),
  patient_id: z.string().uuid('Invalid patient ID'),
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  diagnosis: z.string()
    .trim()
    .max(2000, 'Diagnosis must be less than 2000 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
  instructions: z.string()
    .trim()
    .max(5000, 'Instructions must be less than 5000 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
  duration_days: z.number()
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 day')
    .max(365, 'Duration cannot exceed 365 days')
    .nullable()
    .optional()
});

export const herbItemSchema = z.object({
  herb_id: z.string().uuid('Invalid herb ID'),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(9999, 'Quantity cannot exceed 9999'),
  unit_price: z.number()
    .positive('Unit price must be positive')
    .max(999999, 'Unit price is too large'),
  dosage_instructions: z.string()
    .max(500, 'Dosage instructions must be less than 500 characters')
    .nullable()
    .optional()
    .or(z.literal(''))
});

export type RecommendationFormData = z.infer<typeof recommendationSchema>;
export type HerbItemFormData = z.infer<typeof herbItemSchema>;
