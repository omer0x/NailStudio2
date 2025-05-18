/*
  # Update user registration and profile handling

  1. Changes
    - Update handle_new_user function to properly store user metadata
    - Add phone field handling
    - Ensure data consistency between auth and profiles
  
  2. Security
    - Maintain existing security policies
    - Keep admin privileges intact
*/

-- Update the handle_new_user function to properly handle all user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create or update the user profile with metadata
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
    COALESCE((new.raw_user_meta_data->>'is_admin')::boolean, false),
    COALESCE(new.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = now()
  WHERE
    -- Only update if there are actual changes
    public.user_profiles.full_name IS DISTINCT FROM EXCLUDED.full_name OR
    public.user_profiles.phone IS DISTINCT FROM EXCLUDED.phone;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;