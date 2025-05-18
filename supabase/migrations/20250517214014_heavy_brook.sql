/*
  # Add admin check function
  
  1. New Function
    - `check_if_user_is_admin`: A database function that safely checks if a user is an admin
    
  2. Security
    - Function is accessible to authenticated users only
    - Uses SECURITY DEFINER to bypass RLS
*/

CREATE OR REPLACE FUNCTION check_if_user_is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE id = user_id AND is_admin = true
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_if_user_is_admin(UUID) TO authenticated;