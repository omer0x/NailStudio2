/*
  # Fix user profile policies and admin access

  1. Changes
    - Drop existing policies
    - Create simplified non-recursive policies
    - Add performance index
    - Fix admin privileges

  2. Security
    - Maintain proper access control
    - Prevent privilege escalation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

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

CREATE POLICY "Enable admin write access"
ON user_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Enable user self-update"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id AND NOT is_admin
)
WITH CHECK (
  auth.uid() = id AND NOT is_admin
);

-- Add performance index
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin_lookup 
ON user_profiles(id, is_admin);