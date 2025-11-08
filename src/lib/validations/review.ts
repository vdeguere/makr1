import { z } from 'zod';

const mediaSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  type: z.enum(['image', 'video']),
  order: z.number().int().min(0)
});

export const reviewSchema = z.object({
  herb_id: z.string().uuid('Invalid product ID'),
  patient_id: z.string().uuid('Invalid patient ID').optional().nullable(),
  rating: z.number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  title: z.string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .optional()
    .nullable(),
  review_text: z.string()
    .trim()
    .min(10, 'Review must be at least 10 characters')
    .max(1000, 'Review must be less than 1000 characters')
    .optional()
    .nullable(),
  reviewer_name: z.string()
    .trim()
    .min(2, 'Reviewer name must be at least 2 characters')
    .max(100, 'Reviewer name must be less than 100 characters')
    .optional()
    .nullable(),
  media: z.array(mediaSchema)
    .max(5, 'Maximum 5 images/videos allowed')
    .optional()
    .nullable()
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
