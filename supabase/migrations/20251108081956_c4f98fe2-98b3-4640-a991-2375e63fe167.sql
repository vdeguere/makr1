-- Add vital signs columns to visit_notes table
ALTER TABLE public.visit_notes 
ADD COLUMN blood_pressure_systolic integer,
ADD COLUMN blood_pressure_diastolic integer,
ADD COLUMN heart_rate integer,
ADD COLUMN temperature numeric(4,1),
ADD COLUMN weight numeric(5,2),
ADD COLUMN height numeric(5,1),
ADD COLUMN respiratory_rate integer,
ADD COLUMN oxygen_saturation integer,
ADD COLUMN vital_notes text;