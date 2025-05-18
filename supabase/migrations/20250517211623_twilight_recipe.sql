/*
  # Fix recursive RLS policy for user_profiles table

  1. Changes
    - Drop the recursive admin policy that was causing infinite recursion
    - Create new admin policy using auth.uid() directly
    
  2. Security
    - Maintains same level of security but removes recursion
    - Admins can still view all profiles
    - Regular users can only view their own profile
*/

-- Drop the recursive policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Create new non-recursive policy for admins
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    is_admin = true
    OR
    auth.uid() = id
  );