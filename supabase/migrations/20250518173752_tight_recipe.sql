/*
  # Fix appointment booking functionality

  1. Changes
    - Update RLS policies for appointments and related tables
    - Add policies to allow users to create appointments
    - Add policies to allow users to view their appointments
    - Add policies to allow admins to manage all appointments
    
  2. Security
    - Users can only book appointments for themselves
    - Users can only view their own appointments
    - Admins retain full access to all appointments
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can create their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their own pending appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can update any appointment" ON appointments;

-- Create new appointment policies
CREATE POLICY "Users can create appointments"
ON appointments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  status = 'pending' AND
  date >= CURRENT_DATE
);

CREATE POLICY "Users can view own appointments"
ON appointments
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Users can update own pending appointments"
ON appointments
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id AND
  status = 'pending'
)
WITH CHECK (
  auth.uid() = user_id AND
  status IN ('pending', 'cancelled')
);

CREATE POLICY "Admins can manage all appointments"
ON appointments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Drop existing policies for appointment_services
DROP POLICY IF EXISTS "Users can create their own appointment services" ON appointment_services;
DROP POLICY IF EXISTS "Users can view their own appointment services" ON appointment_services;
DROP POLICY IF EXISTS "Admins can view all appointment services" ON appointment_services;
DROP POLICY IF EXISTS "Admins can update any appointment service" ON appointment_services;

-- Create new appointment_services policies
CREATE POLICY "Users can create appointment services"
ON appointment_services
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM appointments
    WHERE id = appointment_id
    AND user_id = auth.uid()
    AND status = 'pending'
  )
);

CREATE POLICY "Users can view own appointment services"
ON appointment_services
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM appointments
    WHERE id = appointment_id AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND is_admin = true
      )
    )
  )
);

CREATE POLICY "Admins can manage all appointment services"
ON appointment_services
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Add validation function for appointments
CREATE OR REPLACE FUNCTION validate_appointment()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the time slot is available
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE date = NEW.date
    AND time_slot_id = NEW.time_slot_id
    AND status != 'cancelled'
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'This time slot is already booked';
  END IF;

  -- Check if the time slot exists and is available
  IF NOT EXISTS (
    SELECT 1 FROM time_slots
    WHERE id = NEW.time_slot_id
    AND is_available = true
  ) THEN
    RAISE EXCEPTION 'Invalid or unavailable time slot';
  END IF;

  -- Check if the date is in the future
  IF NEW.date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot book appointments in the past';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for appointment validation
DROP TRIGGER IF EXISTS validate_appointment_trigger ON appointments;
CREATE TRIGGER validate_appointment_trigger
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment();