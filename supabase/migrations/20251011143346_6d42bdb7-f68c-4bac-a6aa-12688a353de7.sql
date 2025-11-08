-- Remove public read access to patient_connection_tokens
-- This prevents unauthenticated users from enumerating valid tokens
DROP POLICY IF EXISTS "Public can read valid tokens by token value" ON public.patient_connection_tokens;

-- Edge functions will continue to work using service role key
-- Keep existing policies for admins, practitioners, and system updates