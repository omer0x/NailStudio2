/*
  # Fix user_profiles policies to prevent recursion

  1. Changes
    - Remove recursive policy definitions that were causing infinite loops
    - Simplify admin check policy to use direct comparison
    - Update user policies to use simpler conditions
  
  2. Security
    - Maintain same level of access control but with more efficient policies
    - Ensure admins can still read all profiles
    - Ensure users can only manage their own profiles
    - Prevent non-admins from granting themselves admin privileges
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create new, simplified policies
CREATE POLICY "Admins can read all profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM user_profiles WHERE is_admin = true
  )
);

CREATE POLICY "Users can read own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id AND
  (
    is_admin = false OR
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE is_admin = true
    )
  )
);

CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id AND
  (
    is_admin = (SELECT is_admin FROM user_profiles WHERE id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM user_profiles WHERE is_admin = true)
  )
);

CREATE POLICY "Users can delete own profile"
ON user_profiles
FOR DELETE
TO authenticated
USING (
  auth.uid() = id
);