-- Step 1: Add 'dev' to the existing app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'dev';