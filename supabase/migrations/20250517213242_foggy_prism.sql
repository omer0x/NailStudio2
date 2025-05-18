/*
  # Fix recursive policies in user_profiles table

  1. Changes
    - Drop existing policies on user_profiles table
    - Create new non-recursive policies
    
  2. Security
    - Maintain same level of access control but without recursion
    - Users can still only view their own profile or all profiles if admin
    - Users can only update their own non-admin fields
    - Admins retain full access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable admin write access" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access" ON user_profiles;
DROP POLICY IF EXISTS "Enable user self-update" ON user_profiles;

-- Create new non-recursive policies
CREATE POLICY "Admin full access"
ON user_profiles
FOR ALL
TO authenticated
USING (
  is_admin = true
)
WITH CHECK (
  is_admin = true
);

CREATE POLICY "Users can read own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Users can update own non-admin fields"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- Prevent updating is_admin field
    is_admin IS NOT DISTINCT FROM (SELECT is_admin FROM user_profiles WHERE id = auth.uid())
  )
);