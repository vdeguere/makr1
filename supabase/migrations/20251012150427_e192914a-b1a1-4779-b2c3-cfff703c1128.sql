-- Add email column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Backfill existing profiles with emails from auth.users
UPDATE public.profiles p
SET email = (
  SELECT au.email 
  FROM auth.users au 
  WHERE au.id = p.id
)
WHERE p.email IS NULL;

-- Update the handle_new_user trigger function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$function$;