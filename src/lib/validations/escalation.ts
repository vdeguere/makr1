import { z } from 'zod';

export const escalationSchema = z.object({
  email: z
    .string()
    .min(1, 'validation.required')
    .email('validation.invalidEmail')
    .max(255, 'validation.maxLength'),
  full_name: z
    .string()
    .max(100, 'validation.maxLength')
    .optional(),
  subject: z
    .string()
    .min(5, 'validation.minLength')
    .max(200, 'validation.maxLength'),
  message_body: z
    .string()
    .min(10, 'validation.minLength')
    .max(2000, 'validation.maxLength'),
  include_chat_history: z.boolean().default(true),
});

export type EscalationFormData = z.infer<typeof escalationSchema>;