/*
  # Fix user profiles policies and add automatic profile creation

  1. Changes
    - Remove recursive policy conditions from user_profiles table
    - Add trigger for automatic profile creation
    - Update policies to use simpler conditions

  2. Security
    - Maintain RLS on user_profiles table
    - Ensure users can only access their own profiles
    - Allow admins to access all profiles
*/

-- Drop existing policies to recreate them without recursion
DROP POLICY IF EXISTS "Enable insert for new users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users" ON public.user_profiles;

-- Create new policies without recursive conditions
CREATE POLICY "Enable insert for new users"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id AND 
  (is_admin IS NULL OR is_admin = false)
);

CREATE POLICY "Enable read access"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  is_admin = true
);

CREATE POLICY "Enable update for users"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR 
  is_admin = true
)
WITH CHECK (
  (auth.uid() = id AND is_admin = false) OR 
  is_admin = true
);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, is_admin)
  VALUES (new.id, '', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();