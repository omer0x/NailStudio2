/*
  # Fix admin appointments access and add RPC function
  
  1. Changes
    - Add RPC function to check admin status
    - Add RPC function to get appointments with user info
    - Update appointments policies
    
  2. Security
    - Maintain proper access control
    - Use RPC to avoid policy recursion
*/

-- Create function to check if user is admin
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

-- Create function to get appointments with user info
CREATE OR REPLACE FUNCTION get_appointments_with_users()
RETURNS TABLE (
  id UUID,
  date DATE,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  user_id UUID,
  user_full_name TEXT,
  user_email TEXT,
  time_slot_start TIME,
  services JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT check_if_user_is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. User is not an admin.';
  END IF;

  RETURN QUERY
  SELECT 
    a.id,
    a.date,
    a.status,
    a.notes,
    a.created_at,
    up.id as user_id,
    up.full_name as user_full_name,
    up.email as user_email,
    ts.start_time as time_slot_start,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', s.name,
          'price', s.price
        )
      )
      FROM appointment_services aps
      JOIN services s ON s.id = aps.service_id
      WHERE aps.appointment_id = a.id
    ) as services
  FROM appointments a
  JOIN user_profiles up ON up.id = a.user_id
  JOIN time_slots ts ON ts.id = a.time_slot_id
  ORDER BY a.date DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_if_user_is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_appointments_with_users TO authenticated;