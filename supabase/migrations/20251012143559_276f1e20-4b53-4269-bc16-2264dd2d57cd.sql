-- Add payment_intent_id column to orders table for PromptPay payments
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id 
ON public.orders(stripe_payment_intent_id);

-- Add comment
COMMENT ON COLUMN public.orders.stripe_payment_intent_id IS 'Stripe PaymentIntent ID for PromptPay payments';
