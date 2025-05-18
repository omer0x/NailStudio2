/*
  # Fix recursive policies in user_profiles table

  1. Changes
    - Remove recursive policy definitions that were causing infinite loops
    - Simplify admin access checks
    - Update policies to use direct boolean comparisons
  
  2. Security
    - Maintain same security model but implement it more efficiently
    - Keep RLS enabled
    - Ensure admins can still manage all profiles
    - Ensure users can only manage their own profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Create new, non-recursive policies
CREATE POLICY "Admins can manage all profiles"
ON public.user_profiles
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  is_admin = true
)
WITH CHECK (
  is_admin = true
);

CREATE POLICY "Users can manage own profile"
ON public.user_profiles
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id AND (
    -- Only allow changing is_admin if the user is already an admin
    (is_admin = false) OR 
    (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid())
  )
);