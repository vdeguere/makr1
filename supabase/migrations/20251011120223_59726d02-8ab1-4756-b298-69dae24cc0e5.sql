-- Create dev_role_overrides table to track which role devs are viewing as
CREATE TABLE public.dev_role_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  active_role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dev_role_overrides ENABLE ROW LEVEL SECURITY;

-- Only devs can manage their own overrides
CREATE POLICY "Devs can manage their own role overrides"
ON public.dev_role_overrides
FOR ALL
USING (
  user_id = auth.uid() AND 
  public.has_role(auth.uid(), 'dev'::app_role)
);

-- Update has_role function to grant devs admin permissions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR role = 'dev'::app_role)
  )
$$;

-- Create get_active_role function
-- Returns the role a user is currently viewing as
-- For devs: returns their active_role override if set, otherwise 'admin'
-- For others: returns their actual role
CREATE OR REPLACE FUNCTION public.get_active_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- If dev with override, return override
    (SELECT dro.active_role 
     FROM public.dev_role_overrides dro 
     WHERE dro.user_id = _user_id),
    -- Otherwise return actual role
    (SELECT ur.role 
     FROM public.user_roles ur 
     WHERE ur.user_id = _user_id)
  )
$$;

-- Update chanat.gunn@gmail.com from admin to dev
UPDATE public.user_roles
SET role = 'dev'::app_role
WHERE user_id = 'f91681ff-aa48-4352-b09e-781a00cd9aa5';

-- Set initial active role to admin
INSERT INTO public.dev_role_overrides (user_id, active_role)
VALUES ('f91681ff-aa48-4352-b09e-781a00cd9aa5', 'admin'::app_role)
ON CONFLICT (user_id) DO UPDATE SET active_role = 'admin'::app_role;