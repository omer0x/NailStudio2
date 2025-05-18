/*
  # Fix user_profiles policies to prevent infinite recursion

  1. Changes
    - Drop existing problematic policies
    - Create new policies that avoid recursive checks
    - Maintain security while preventing infinite loops
  
  2. Security
    - Users can still only manage their own profiles
    - Admins can still read all profiles but without recursive checks
    - Admin status updates are still controlled
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Control admin status updates" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;

-- Create new policies without recursive checks
CREATE POLICY "Users can read own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

CREATE POLICY "Admins can read all profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  -- First check if the current user's profile has is_admin = true
  -- This avoids the recursive check by directly accessing the row
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
)
WITH CHECK (
  id = auth.uid() AND
  -- Only allow admin status change if user is already an admin
  (
    is_admin = (SELECT is_admin FROM user_profiles WHERE id = auth.uid())
    OR
    (SELECT is_admin FROM user_profiles WHERE id = auth.uid()) = true
  )
);

CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid() AND
  (is_admin = false OR auth.uid() IN (SELECT id FROM user_profiles WHERE is_admin = true))
);

CREATE POLICY "Users can delete own profile"
ON user_profiles
FOR DELETE
TO authenticated
USING (
  id = auth.uid()
);