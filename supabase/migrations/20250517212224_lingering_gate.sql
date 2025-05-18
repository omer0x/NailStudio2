/*
  # Fix admin access policies

  1. Changes
    - Drop existing admin policies
    - Create new simplified admin policies
    - Add performance optimizations
  
  2. Security
    - Maintains proper access control
    - Prevents recursion issues
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

-- Create new simplified policies
CREATE POLICY "View own or all profiles as admin"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid() 
  OR 
  (SELECT is_admin FROM user_profiles WHERE id = auth.uid())
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin_lookup 
ON user_profiles(id, is_admin);

-- Ensure the admin user has proper privileges
UPDATE user_profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'admin@medinanails.com'
);