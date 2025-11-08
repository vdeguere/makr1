import { z } from 'zod';

export const wellnessSurveySchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  recommendation_id: z.string().uuid('Invalid recommendation ID').nullable().optional(),
  overall_feeling: z.number()
    .int('Must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  symptom_improvement: z.number()
    .int('Must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  treatment_satisfaction: z.number()
    .int('Must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  energy_levels: z.number()
    .int('Must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  sleep_quality: z.number()
    .int('Must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .nullable()
    .optional()
    .or(z.literal(''))
});

export type WellnessSurveyFormData = z.infer<typeof wellnessSurveySchema>;
