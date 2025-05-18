/*
  # Fix admin policy for user profiles

  1. Changes
    - Drop existing admin policy
    - Create new admin policy with correct condition
    - Add index on is_admin column for better performance

  2. Security
    - Ensures admin users can view all profiles
    - Maintains proper access control
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Create new admin policy with simpler condition
CREATE POLICY "Admins can view all profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.is_admin = true
  )
);

-- Add index to improve policy performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);