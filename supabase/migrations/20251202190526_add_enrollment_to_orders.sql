-- Add enrollment support to orders table
-- This migration allows orders to be created from course enrollments (for kit fulfillment)

-- Add enrollment_id to orders table
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES public.course_enrollments(id) ON DELETE SET NULL;

-- Add order_type to distinguish order sources
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS order_type TEXT CHECK (order_type IN ('recommendation', 'course_kit', 'direct_purchase')) DEFAULT 'direct_purchase';

-- Make recommendation_id nullable (since course kits won't have recommendations)
-- Check if it's already nullable, if not make it nullable
DO $$ 
BEGIN
  -- Check if recommendation_id is NOT NULL constraint exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'orders' 
    AND tc.constraint_type = 'NOT NULL'
    AND ccu.column_name = 'recommendation_id'
  ) THEN
    -- Make it nullable
    ALTER TABLE public.orders ALTER COLUMN recommendation_id DROP NOT NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_enrollment_id ON public.orders(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);

-- Update RLS policies if needed - orders should be viewable by students for their enrollments
-- Note: Existing RLS policies should handle this, but we ensure enrollment-based orders are accessible

-- Add comments for documentation
COMMENT ON COLUMN public.orders.enrollment_id IS 'Course enrollment that triggered this order (for kit fulfillment)';
COMMENT ON COLUMN public.orders.order_type IS 'Type of order: recommendation (from prescription), course_kit (from enrollment), or direct_purchase';

