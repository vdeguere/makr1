-- Add new demographic and medical baseline columns to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS birth_time time,
ADD COLUMN IF NOT EXISTS height numeric(5,2),
ADD COLUMN IF NOT EXISTS weight numeric(5,2),
ADD COLUMN IF NOT EXISTS past_operations text;

-- Add comments for documentation
COMMENT ON COLUMN patients.gender IS 'Patient gender (Male/Female/Other/Prefer not to say)';
COMMENT ON COLUMN patients.birth_time IS 'Exact birth time for Thai astrological calculations';
COMMENT ON COLUMN patients.height IS 'Baseline height in centimeters';
COMMENT ON COLUMN patients.weight IS 'Baseline weight in kilograms';
COMMENT ON COLUMN patients.past_operations IS 'History of surgical procedures and operations';