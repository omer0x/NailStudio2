/*
  # Fix user profiles and appointments flow

  1. Changes
    - Add trigger to automatically create user profile when a new user is created
    - Update user profile policies to allow creation during signup
    - Add function to ensure user profile exists
  
  2. Security
    - Maintain RLS protection
    - Allow profile creation only for authenticated users
    - Prevent privilege escalation
*/

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, is_admin)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update user_profiles policies
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;

-- Create new simplified policies
CREATE POLICY "Enable read access"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Enable insert for new users"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id AND
  (is_admin IS NULL OR is_admin = false)
);

CREATE POLICY "Enable update for users"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR
  (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  ))
)
WITH CHECK (
  (auth.uid() = id AND is_admin = false) OR
  (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  ))
);

-- Create function to ensure user profile exists
CREATE OR REPLACE FUNCTION ensure_user_profile_exists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, is_admin)
  VALUES (NEW.user_id, false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for appointments to ensure user profile exists
DROP TRIGGER IF EXISTS ensure_user_profile_trigger ON appointments;
CREATE TRIGGER ensure_user_profile_trigger
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_profile_exists();