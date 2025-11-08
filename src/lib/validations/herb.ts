import { z } from 'zod';

const imageSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  isPrimary: z.boolean().default(false),
  order: z.number().int().min(0),
  caption: z.string().max(200).optional().nullable()
});

export const herbSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters'),
  
  thai_name: z.string()
    .trim()
    .max(200, 'Thai name must be less than 200 characters')
    .optional()
    .nullable(),
  
  scientific_name: z.string()
    .trim()
    .max(200, 'Scientific name must be less than 200 characters')
    .optional()
    .nullable(),
  
  description: z.string()
    .trim()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),
  
  properties: z.string()
    .trim()
    .max(2000, 'Properties must be less than 2000 characters')
    .optional()
    .nullable(),
  
  dosage_instructions: z.string()
    .trim()
    .max(1000, 'Dosage instructions must be less than 1000 characters')
    .optional()
    .nullable(),
  
  contraindications: z.string()
    .trim()
    .max(1000, 'Contraindications must be less than 1000 characters')
    .optional()
    .nullable(),
  
  cost_per_unit: z.number()
    .positive('Cost must be positive')
    .max(999999, 'Cost is too high')
    .optional()
    .nullable(),
  
  retail_price: z.number()
    .positive('Price must be positive')
    .max(999999, 'Price is too high')
    .optional()
    .nullable(),
  
  commission_rate: z.number()
    .min(0, 'Commission rate must be between 0 and 1')
    .max(1, 'Commission rate must be between 0 and 1')
    .optional()
    .nullable(),
  
  stock_quantity: z.number()
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(999999, 'Stock quantity is too high')
    .optional()
    .nullable(),
  
  image_url: z.string()
    .trim()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional()
    .nullable(),
  
  images: z.array(imageSchema)
    .max(10, 'Maximum 10 images allowed')
    .optional()
    .nullable()
    .refine(
      (images) => {
        if (!images || images.length === 0) return true;
        const primaryCount = images.filter(img => img.isPrimary).length;
        return primaryCount <= 1;
      },
      { message: 'Only one image can be set as primary' }
    ),
  
  category_id: z.string()
    .uuid('Invalid category')
    .optional()
    .nullable(),
  
  brand: z.string()
    .trim()
    .max(100, 'Brand name must be less than 100 characters')
    .optional()
    .nullable(),
  
  certifications: z.array(z.string())
    .optional()
    .nullable(),
  
  price_currency: z.string()
    .regex(/^[A-Z]{3}$/, 'Invalid currency code')
    .default('THB')
    .optional()
    .nullable(),
  
  supported_currencies: z.record(
    z.string().regex(/^[A-Z]{3}$/),
    z.object({
      cost_per_unit: z.number().positive().nullable(),
      retail_price: z.number().positive().nullable(),
    })
  ).optional().nullable(),
  
  subscription_enabled: z.boolean()
    .default(false)
    .optional()
    .nullable(),
  
  subscription_discount_percentage: z.number()
    .min(0, 'Discount must be 0 or greater')
    .max(100, 'Discount cannot exceed 100%')
    .optional()
    .nullable(),
  
  subscription_intervals: z.array(z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annually']))
    .optional()
    .nullable()
    .default(['monthly'])
});

export type HerbFormData = z.infer<typeof herbSchema>;
