-- Create body_marker_types table for custom marker management
CREATE TABLE public.body_marker_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id),
  name text NOT NULL,
  icon_name text NOT NULL,
  color text NOT NULL DEFAULT 'text-red-500',
  description text,
  is_system_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.body_marker_types ENABLE ROW LEVEL SECURITY;

-- Admins can manage all marker types
CREATE POLICY "Admins can manage all marker types"
ON public.body_marker_types
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Practitioners can create their own marker types
CREATE POLICY "Practitioners can create marker types"
ON public.body_marker_types
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'practitioner'::app_role) 
  AND created_by = auth.uid()
);

-- Anyone can view system defaults and practitioners can view their own
CREATE POLICY "Users can view marker types"
ON public.body_marker_types
FOR SELECT
TO authenticated
USING (
  is_system_default = true 
  OR created_by = auth.uid()
);

-- Practitioners can update their own marker types
CREATE POLICY "Practitioners can update own marker types"
ON public.body_marker_types
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Practitioners can delete their own non-system marker types
CREATE POLICY "Practitioners can delete own marker types"
ON public.body_marker_types
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() 
  AND is_system_default = false
);

-- Insert default marker types
INSERT INTO public.body_marker_types (name, icon_name, color, description, is_system_default, created_by) VALUES
  ('Pain', 'Circle', 'text-red-500', 'General pain or discomfort', true, NULL),
  ('Numbness', 'Droplet', 'text-blue-500', 'Loss of sensation or numbness', true, NULL),
  ('Swelling', 'CircleDot', 'text-purple-500', 'Inflammation or swelling', true, NULL),
  ('Burning', 'Flame', 'text-orange-500', 'Burning sensation', true, NULL),
  ('Tingling', 'Zap', 'text-yellow-500', 'Tingling or pins-and-needles sensation', true, NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_body_marker_types_updated_at
  BEFORE UPDATE ON public.body_marker_types
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();