import { z } from 'zod';

export const sectionSchema = z.object({
  course_id: z.string()
    .uuid('Invalid course'),
  
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  
  description: z.string()
    .trim()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),
  
  display_order: z.number()
    .int('Display order must be a whole number')
    .min(0, 'Display order cannot be negative')
    .default(0),
  
  is_published: z.boolean()
    .default(true),
});

export const courseSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  
  description: z.string()
    .trim()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),
  
  category: z.string()
    .trim()
    .max(100, 'Category must be less than 100 characters')
    .optional()
    .nullable(),
  
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced'])
    .optional()
    .nullable(),
  
  estimated_hours: z.number()
    .int('Estimated hours must be a whole number')
    .min(0, 'Hours cannot be negative')
    .max(1000, 'Hours is too high')
    .optional()
    .nullable(),
  
  prerequisites: z.array(z.string())
    .optional()
    .nullable()
    .default([]),
  
  learning_outcomes: z.array(z.string())
    .optional()
    .nullable()
    .default([]),
  
  thumbnail_url: z.string()
    .trim()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional()
    .nullable(),
  
  preview_video_url: z.string()
    .trim()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional()
    .nullable(),
  
  is_published: z.boolean()
    .default(false),
  
  display_order: z.number()
    .int('Display order must be a whole number')
    .min(0, 'Display order cannot be negative')
    .default(0),
  
  target_audience: z.enum(['practitioner', 'patient', 'both'])
    .default('practitioner'),
});

export const lessonSchema = z.object({
  course_id: z.string()
    .uuid('Invalid course'),
  
  section_id: z.string()
    .uuid('Invalid section')
    .optional()
    .nullable(),
  
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  
  description: z.string()
    .trim()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),
  
  lesson_type: z.enum(['video', 'reading', 'quiz'])
    .default('video'),
  
  content_url: z.string()
    .trim()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional()
    .nullable(),
  
  video_duration_seconds: z.number()
    .int('Duration must be a whole number')
    .min(0, 'Duration cannot be negative')
    .optional()
    .nullable(),
  
  transcript: z.string()
    .trim()
    .max(10000, 'Transcript is too long')
    .optional()
    .nullable(),
  
  is_published: z.boolean()
    .default(false),
  
  display_order: z.number()
    .int('Display order must be a whole number')
    .min(0, 'Display order cannot be negative')
    .default(0),
});

export type SectionFormData = z.infer<typeof sectionSchema>;
export type CourseFormData = z.infer<typeof courseSchema>;
export type LessonFormData = z.infer<typeof lessonSchema>;
