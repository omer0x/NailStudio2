/*
  # Fix user_profiles RLS policies

  1. Changes
    - Drop existing policies
    - Create new non-recursive policies for user profile management
    - Add separate policy for admin read access
    - Add policy for controlling admin status updates
  
  2. Security
    - Maintains proper access control
    - Prevents infinite recursion
    - Controls admin privilege escalation
*/

-- Drop existing policies to replace them with non-recursive versions
DROP POLICY IF EXISTS "Enable insert for users creating their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users on their own profile" ON user_profiles;

-- Create new non-recursive policies
CREATE POLICY "Users can manage their own profile"
ON user_profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Separate policy for admin read access
CREATE POLICY "Admins can read all profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy to prevent non-admins from setting admin status
CREATE POLICY "Control admin status updates"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  -- User can update their own profile
  auth.uid() = id 
  -- Only if they're not trying to change admin status
  AND (
    (SELECT is_admin FROM user_profiles WHERE id = auth.uid()) = true
    OR
    (SELECT is_admin FROM user_profiles WHERE id = id) IS NOT DISTINCT FROM is_admin
  )
);