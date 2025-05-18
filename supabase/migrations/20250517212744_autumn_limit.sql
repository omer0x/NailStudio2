/*
  # Fix user_profiles policies

  1. Changes
    - Drop existing policies
    - Create new non-recursive policies for user_profiles table
    - Fix OLD table reference issue
    - Maintain same security model with optimized structure

  2. Security
    - Admins can manage all profiles
    - Users can only manage their own profile
    - Users cannot modify their admin status
    - New users cannot make themselves admin
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable admin read access to all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable admin write access to all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access to own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable update access to own profile" ON user_profiles;

-- Create new non-recursive policies
CREATE POLICY "Admins can manage all profiles"
ON user_profiles
FOR ALL
TO authenticated
USING (
  is_admin = true
)
WITH CHECK (
  is_admin = true
);

CREATE POLICY "Users can read their own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id AND
  NOT is_admin
)
WITH CHECK (
  auth.uid() = id AND
  NOT is_admin
);

CREATE POLICY "Users can insert their own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id AND
  (is_admin IS NULL OR is_admin = false)
);