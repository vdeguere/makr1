-- Update Vick's role from 'admin' to 'dev'
UPDATE public.user_roles 
SET role = 'dev'
WHERE user_id = '4a91cd89-ef7c-48f3-aa72-ea3a6b1e4132';