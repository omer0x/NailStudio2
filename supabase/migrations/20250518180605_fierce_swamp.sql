/*
  # Fix user registration and profile creation

  1. Changes
    - Update handle_new_user function to properly handle user metadata
    - Ensure full_name and phone are correctly stored in user_profiles
    
  2. Security
    - Maintain existing security model
    - Keep function as SECURITY DEFINER
*/

-- Update the handle_new_user function to properly handle user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    full_name,
    phone,
    is_admin,
    created_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', null),
    false,
    COALESCE(new.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();