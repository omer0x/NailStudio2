/*
  # Create new admin user

  1. Changes
    - Create admin user with a different email
    - Create corresponding admin profile
  
  2. Security
    - Uses proper password hashing with pgcrypto
    - Sets admin privileges correctly
*/

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the admin user and store the ID
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Insert admin user and get the ID
  INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin
  ) VALUES (
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin2@medinanails.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false
  )
  RETURNING id INTO admin_id;

  -- Create the admin profile using the same ID
  INSERT INTO public.user_profiles (
    id,
    full_name,
    is_admin,
    created_at
  ) VALUES (
    admin_id,
    'Admin User',
    true,
    now()
  );
END $$;