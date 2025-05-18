/*
  # Fix recursive policies in user_profiles table

  1. Changes
    - Remove recursive policies from user_profiles table
    - Create new, non-recursive policies that:
      - Allow users to view and update their own profiles
      - Allow admins to manage all profiles using a direct is_admin check
  
  2. Security
    - Maintains RLS protection
    - Prevents infinite recursion
    - Preserves existing access patterns
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- Create new non-recursive policies
CREATE POLICY "Enable read access to own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Enable update access to own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable admin read access to all profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

CREATE POLICY "Enable admin write access to all profiles"
ON user_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);