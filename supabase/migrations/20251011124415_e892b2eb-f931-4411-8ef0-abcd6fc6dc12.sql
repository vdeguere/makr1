-- Update dev profile with practitioner data
UPDATE public.profiles 
SET 
  specialization = 'Traditional Thai Medicine',
  license_number = 'DEV-001'
WHERE id = '4a91cd89-ef7c-48f3-aa72-ea3a6b1e4132';

-- Create linked patient record for dev user
INSERT INTO public.patients (
  user_id,
  practitioner_id,
  full_name,
  email,
  phone,
  date_of_birth,
  medical_history,
  allergies
) VALUES (
  '4a91cd89-ef7c-48f3-aa72-ea3a6b1e4132',
  '4a91cd89-ef7c-48f3-aa72-ea3a6b1e4132',
  'Wick',
  'vick.umythy@gmail.com',
  '+66-123-4567',
  '1990-01-01',
  'Dev test patient record',
  'None'
)
ON CONFLICT DO NOTHING;