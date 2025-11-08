import { z } from 'zod';

export const messageSchema = z.object({
  message_body: z.string()
    .trim()
    .min(1, 'Message is required')
    .max(5000, 'Message must be less than 5000 characters'),
  recipient_type: z.enum(['practitioner', 'support']),
  recipient_id: z.string().uuid().nullable(),
});

export type MessageFormData = z.infer<typeof messageSchema>;
