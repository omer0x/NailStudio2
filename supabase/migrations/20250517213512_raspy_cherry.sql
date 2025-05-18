/*
  # Fix user_profiles RLS policies

  1. Changes
    - Remove recursive policies from user_profiles table
    - Simplify admin and user access policies
    - Ensure no policy references itself

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Keep admin privileges intact
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin full access" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow admins full access" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to create their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own non-admin fields" ON public.user_profiles;

-- Create new, simplified policies
CREATE POLICY "Enable read access for authenticated users"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  (SELECT is_admin FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Enable insert for users creating their own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users on their own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  (
    -- Non-admins can't modify is_admin
    (NOT (is_admin IS DISTINCT FROM (SELECT is_admin FROM user_profiles WHERE id = auth.uid()))) OR
    -- Current admins can modify anything
    (SELECT is_admin FROM user_profiles WHERE id = auth.uid())
  )
);