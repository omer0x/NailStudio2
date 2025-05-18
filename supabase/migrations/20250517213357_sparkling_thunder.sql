/*
  # Fix user profiles RLS policies

  1. Changes
    - Drop existing policies
    - Create new policies that properly handle user profile creation and access
    - Fix issue with new users not being able to create their profiles
  
  2. Security
    - Maintain proper access control
    - Allow new users to create their profiles
    - Prevent unauthorized access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access" ON user_profiles;
DROP POLICY IF EXISTS "Enable admin write access" ON user_profiles;
DROP POLICY IF EXISTS "Enable user self-update" ON user_profiles;

-- Create new policies
CREATE POLICY "Allow users to create their own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
);

CREATE POLICY "Allow users to read their own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR is_admin = true
);

CREATE POLICY "Allow users to update their own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id AND
  CASE 
    WHEN is_admin = true THEN 
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
    ELSE 
      true
  END
);

CREATE POLICY "Allow admins full access"
ON user_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
);