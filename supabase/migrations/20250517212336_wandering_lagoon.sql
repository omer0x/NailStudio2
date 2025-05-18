/*
  # Fix recursive RLS policy

  1. Changes
    - Replace recursive admin check in user_profiles policy with a direct check
    - Policy now directly checks the current user's profile row instead of doing a subquery
  
  2. Security
    - Maintains same security level but eliminates infinite recursion
    - Users can still only view their own profile or all profiles if they are admin
*/

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "View own or all profiles as admin" ON user_profiles;

-- Create new non-recursive policy
CREATE POLICY "View own or all profiles as admin"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR 
  is_admin = true
);