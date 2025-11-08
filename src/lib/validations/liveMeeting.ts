import { z } from 'zod';

export const liveMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().nullable(),
  stream_url: z.string().url('Must be a valid URL'),
  stream_platform: z.enum(['google_meet', 'zoom', 'youtube', 'custom']).optional().nullable(),
  scheduled_start_time: z.string().min(1, 'Start time is required'),
  scheduled_end_time: z.string().optional().nullable(),
  is_published: z.boolean().default(false),
  max_attendees: z.number().int().positive().optional().nullable(),
  meeting_type: z.enum(['open', 'restricted']).default('open'),
  allowed_roles: z.array(z.string()).default(['admin', 'practitioner', 'patient']),
  tags: z.array(z.string()).optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable(),
});

export type LiveMeetingFormData = z.infer<typeof liveMeetingSchema>;
