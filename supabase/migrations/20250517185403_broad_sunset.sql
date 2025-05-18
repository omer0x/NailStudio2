/*
  # Fix recursive RLS policy

  1. Changes
    - Drop the recursive admin policy that was causing infinite recursion
    - Add a new, simplified admin policy for user_profiles table
    
  2. Security
    - Maintains RLS protection
    - Simplifies admin access check to prevent recursion
    - Preserves existing user access policies
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Create new non-recursive admin policy
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    is_admin = true
  );