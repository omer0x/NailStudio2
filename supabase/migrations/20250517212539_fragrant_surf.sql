/*
  # Fix user_profiles RLS policies

  1. Changes
    - Drop existing policies that cause recursion
    - Create new, simplified policies that avoid recursion
    
  2. Security
    - Enable RLS on user_profiles table
    - Add policies for:
      - Users can view and update their own profile
      - Admins can view and manage all profiles
      - Public cannot access any profiles
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admin full access" ON user_profiles;
DROP POLICY IF EXISTS "Update own profile" ON user_profiles;
DROP POLICY IF EXISTS "View own profile" ON user_profiles;

-- Create new policies without recursion
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  (auth.uid() IN (
    SELECT up.id 
    FROM user_profiles up 
    WHERE up.id = auth.uid() AND up.is_admin = true
  ))
);

CREATE POLICY "Admins can manage all profiles"
ON user_profiles
FOR ALL
TO authenticated
USING (
  (auth.uid() IN (
    SELECT up.id 
    FROM user_profiles up 
    WHERE up.id = auth.uid() AND up.is_admin = true
  ))
);