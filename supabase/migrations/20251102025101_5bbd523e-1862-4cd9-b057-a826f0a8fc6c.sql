-- Expand profiles table to accommodate both patient and practitioner data
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS medical_history TEXT,
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS email_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS practice_name TEXT,
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create or replace function to handle new user signup with role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile with basic info
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );

  -- Insert role based on metadata if provided
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'role')::app_role
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();