import { z } from 'zod';

export const treatmentScheduleSchema = z.object({
  recommendation_id: z.string().uuid('Invalid recommendation ID'),
  patient_id: z.string().uuid('Invalid patient ID'),
  herb_id: z.string().uuid().nullable().optional(),
  medication_name: z.string()
    .trim()
    .min(1, 'Medication name is required')
    .max(200, 'Medication name must be less than 200 characters'),
  dosage: z.string()
    .trim()
    .min(1, 'Dosage is required')
    .max(100, 'Dosage must be less than 100 characters'),
  frequency: z.enum(['once_daily', 'twice_daily', 'three_times_daily', 'as_needed'], {
    errorMap: () => ({ message: 'Please select a valid frequency' })
  }),
  times_of_day: z.array(z.string()).min(1, 'At least one time is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().nullable().optional(),
  instructions: z.string()
    .max(1000, 'Instructions must be less than 1000 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
  take_with_food: z.boolean().default(false),
  special_instructions: z.string()
    .max(500, 'Special instructions must be less than 500 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
});

export const checkInSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  treatment_schedule_id: z.string().uuid('Invalid treatment schedule ID'),
  check_in_date: z.string().min(1, 'Check-in date is required'),
  status: z.enum(['taken', 'missed', 'skipped', 'delayed'], {
    errorMap: () => ({ message: 'Please select a valid status' })
  }),
  taken_at_time: z.string().nullable().optional().or(z.literal('')),
  side_effects: z.string()
    .max(500, 'Side effects must be less than 500 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
  effectiveness_rating: z.number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5')
    .nullable()
    .optional(),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
});

export const reminderSettingsSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  enabled: z.boolean().default(true),
  reminder_methods: z.array(z.enum(['in_app', 'email', 'line', 'sms'])).default(['in_app']),
  advance_notice_minutes: z.number()
    .int('Must be a whole number')
    .min(0, 'Must be at least 0')
    .max(120, 'Cannot exceed 120 minutes')
    .default(15),
  enable_morning_summary: z.boolean().default(true),
  morning_summary_time: z.string().default('08:00'),
  quiet_hours_start: z.string().default('22:00'),
  quiet_hours_end: z.string().default('07:00'),
  send_missed_reminder: z.boolean().default(true),
  missed_reminder_delay_minutes: z.number()
    .int('Must be a whole number')
    .min(0, 'Must be at least 0')
    .max(240, 'Cannot exceed 240 minutes')
    .default(60),
});

export type TreatmentScheduleFormData = z.infer<typeof treatmentScheduleSchema>;
export type CheckInFormData = z.infer<typeof checkInSchema>;
export type ReminderSettingsFormData = z.infer<typeof reminderSettingsSchema>;
