-- Add TTM intake fields directly to patients table
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS pulse_grid_1 JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pulse_grid_2 JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pulse_grid_3 JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pulse_grid_4 JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pulse_grid_5 JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS body_diagram_front JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS body_diagram_back JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS chief_complaint TEXT,
ADD COLUMN IF NOT EXISTS present_illness TEXT,
ADD COLUMN IF NOT EXISTS past_medical_history TEXT,
ADD COLUMN IF NOT EXISTS family_history TEXT,
ADD COLUMN IF NOT EXISTS social_history TEXT,
ADD COLUMN IF NOT EXISTS current_medications TEXT,
ADD COLUMN IF NOT EXISTS general_appearance TEXT,
ADD COLUMN IF NOT EXISTS tongue_examination TEXT,
ADD COLUMN IF NOT EXISTS abdominal_palpation TEXT,
ADD COLUMN IF NOT EXISTS other_findings TEXT,
ADD COLUMN IF NOT EXISTS ttm_diagnosis TEXT,
ADD COLUMN IF NOT EXISTS ttm_pattern_identification TEXT,
ADD COLUMN IF NOT EXISTS western_diagnosis TEXT,
ADD COLUMN IF NOT EXISTS treatment_plan TEXT,
ADD COLUMN IF NOT EXISTS herbal_prescription TEXT,
ADD COLUMN IF NOT EXISTS dietary_recommendations TEXT,
ADD COLUMN IF NOT EXISTS lifestyle_recommendations TEXT,
ADD COLUMN IF NOT EXISTS follow_up_plan TEXT,
ADD COLUMN IF NOT EXISTS practitioner_notes TEXT;

-- Drop the ttm_intake_forms table as it's no longer needed
DROP TABLE IF EXISTS public.ttm_intake_forms CASCADE;