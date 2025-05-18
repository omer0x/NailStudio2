/*
  # Create missing user profiles

  1. Changes
    - Insert missing user profiles for existing authenticated users
    - Set default values for required fields
    
  2. Security
    - Maintains existing RLS policies
    - Only creates profiles for users that don't have one
*/

-- Insert profiles for existing users that don't have one
INSERT INTO public.user_profiles (id, full_name, is_admin, created_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  false,
  COALESCE(created_at, now())
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

-- Set admin privileges for admin users
UPDATE public.user_profiles
SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('admin@medinanails.com', 'admin2@medinanails.com')
);