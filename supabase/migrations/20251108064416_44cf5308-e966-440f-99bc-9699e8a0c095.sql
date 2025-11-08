-- Add TTM clinical assessment fields to visit_notes table
ALTER TABLE public.visit_notes
ADD COLUMN present_illness text,
ADD COLUMN past_medical_history text,
ADD COLUMN family_history text,
ADD COLUMN social_history text,
ADD COLUMN current_medications text,
ADD COLUMN general_appearance text,
ADD COLUMN tongue_examination text,
ADD COLUMN pulse_grid_1 jsonb DEFAULT '{}'::jsonb,
ADD COLUMN pulse_grid_2 jsonb DEFAULT '{}'::jsonb,
ADD COLUMN pulse_grid_3 jsonb DEFAULT '{}'::jsonb,
ADD COLUMN pulse_grid_4 jsonb DEFAULT '{}'::jsonb,
ADD COLUMN pulse_grid_5 jsonb DEFAULT '{}'::jsonb,
ADD COLUMN body_diagram_front jsonb DEFAULT '[]'::jsonb,
ADD COLUMN body_diagram_back jsonb DEFAULT '[]'::jsonb,
ADD COLUMN abdominal_palpation text,
ADD COLUMN other_findings text,
ADD COLUMN ttm_diagnosis text,
ADD COLUMN ttm_pattern_identification text,
ADD COLUMN western_diagnosis text,
ADD COLUMN treatment_plan text,
ADD COLUMN herbal_prescription text,
ADD COLUMN dietary_recommendations text,
ADD COLUMN lifestyle_recommendations text,
ADD COLUMN follow_up_plan text,
ADD COLUMN practitioner_notes text;

COMMENT ON COLUMN public.visit_notes.present_illness IS 'History of present illness';
COMMENT ON COLUMN public.visit_notes.pulse_grid_1 IS 'Left Hand Superficial pulse examination data';
COMMENT ON COLUMN public.visit_notes.pulse_grid_2 IS 'Left Hand Deep pulse examination data';
COMMENT ON COLUMN public.visit_notes.pulse_grid_3 IS 'Right Hand Superficial pulse examination data';
COMMENT ON COLUMN public.visit_notes.pulse_grid_4 IS 'Right Hand Deep pulse examination data';
COMMENT ON COLUMN public.visit_notes.pulse_grid_5 IS 'Overall Pulse Characteristics';
COMMENT ON COLUMN public.visit_notes.body_diagram_front IS 'Body diagram markers for front view';
COMMENT ON COLUMN public.visit_notes.body_diagram_back IS 'Body diagram markers for back view';
COMMENT ON COLUMN public.visit_notes.ttm_diagnosis IS 'Traditional Tibetan Medicine diagnosis';
COMMENT ON COLUMN public.visit_notes.ttm_pattern_identification IS 'TTM pattern identification';
COMMENT ON COLUMN public.visit_notes.western_diagnosis IS 'Western medicine diagnosis';
COMMENT ON COLUMN public.visit_notes.practitioner_notes IS 'Private practitioner notes';