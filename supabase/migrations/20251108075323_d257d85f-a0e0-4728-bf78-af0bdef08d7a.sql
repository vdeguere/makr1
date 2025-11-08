-- Add id_number column to patients table
ALTER TABLE public.patients 
ADD COLUMN id_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.patients.id_number IS 'Patient identification number assigned by practitioner';