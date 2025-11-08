-- Add Stripe tracking columns to orders table
ALTER TABLE public.orders
ADD COLUMN stripe_session_id text,
ADD COLUMN stripe_payment_intent_id text;

-- Add index for faster lookups by Stripe session ID
CREATE INDEX idx_orders_stripe_session_id ON public.orders(stripe_session_id);

-- Add index for faster lookups by Stripe payment intent ID
CREATE INDEX idx_orders_stripe_payment_intent_id ON public.orders(stripe_payment_intent_id);