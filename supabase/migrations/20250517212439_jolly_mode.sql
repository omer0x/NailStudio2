/*
  # Fix admin access and policies

  1. Changes
    - Drop existing problematic policies
    - Create new simplified policies
    - Ensure admin user has correct privileges
    - Add performance indexes
*/

-- Drop existing policies
DROP POLICY IF EXISTS "View own or all profiles as admin" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Create new simplified policies
CREATE POLICY "View own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admin full access"
ON user_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Ensure admin user has proper privileges
UPDATE user_profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'admin@medinanails.com'
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin_lookup 
ON user_profiles(id, is_admin);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON user_profiles TO authenticated;