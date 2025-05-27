/*
  # Update appointment validation function

  1. Changes
    - Update validate_appointment() function to block all required time slots based on service duration
    - Add trigger to insert blocked time slots into appointments_blocked_slots table
    - Add trigger to remove blocked slots when appointment is cancelled

  2. New Tables
    - appointments_blocked_slots
      - appointment_id (uuid, references appointments)
      - time_slot_id (uuid, references time_slots)
      - created_at (timestamptz)

  3. Security
    - Enable RLS on appointments_blocked_slots table
    - Add policies for admins and users
*/

-- Create table to track blocked time slots for appointments
CREATE TABLE IF NOT EXISTS appointments_blocked_slots (
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  time_slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (appointment_id, time_slot_id)
);

-- Enable RLS
ALTER TABLE appointments_blocked_slots ENABLE ROW LEVEL SECURITY;

-- Policies for appointments_blocked_slots
CREATE POLICY "Admins can manage blocked slots"
  ON appointments_blocked_slots
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "Users can view their blocked slots"
  ON appointments_blocked_slots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointments_blocked_slots.appointment_id
      AND appointments.user_id = auth.uid()
    )
  );

-- Function to calculate total duration and validate time slots
CREATE OR REPLACE FUNCTION validate_appointment()
RETURNS TRIGGER AS $$
DECLARE
  total_duration INTEGER;
  slot_start_time TIME;
  slot_day_of_week INTEGER;
  required_slots INTEGER;
  available_slots INTEGER;
  overlapping_count INTEGER;
  current_slot_id UUID;
BEGIN
  -- Get total duration of all services for this appointment
  SELECT COALESCE(SUM(s.duration), 0)
  INTO total_duration
  FROM appointment_services as_link
  JOIN services s ON s.id = as_link.service_id
  WHERE as_link.appointment_id = NEW.id;
  
  -- Get the time slot details
  SELECT start_time, day_of_week
  INTO slot_start_time, slot_day_of_week
  FROM time_slots
  WHERE id = NEW.time_slot_id;
  
  -- Calculate how many 30-minute slots we need
  required_slots := CEIL(total_duration::FLOAT / 30);
  
  -- Check for overlapping appointments
  SELECT COUNT(*)
  INTO overlapping_count
  FROM appointments a
  JOIN appointments_blocked_slots abs ON abs.appointment_id = a.id
  WHERE a.date = NEW.date
    AND a.id != NEW.id
    AND a.status != 'cancelled'
    AND abs.time_slot_id IN (
      SELECT id FROM time_slots ts
      WHERE ts.day_of_week = slot_day_of_week
        AND ts.start_time >= slot_start_time
        AND ts.start_time < (slot_start_time + (interval '30 minutes' * required_slots))
    );
  
  -- Validate the appointment
  IF overlapping_count > 0 THEN
    RAISE EXCEPTION 'The selected time slot overlaps with existing appointments';
  END IF;
  
  -- Check if we have enough consecutive available slots
  SELECT COUNT(*)
  INTO available_slots
  FROM time_slots ts
  WHERE ts.day_of_week = slot_day_of_week
    AND ts.is_available = true
    AND ts.start_time >= slot_start_time
    AND ts.start_time < (slot_start_time + (interval '30 minutes' * required_slots));
    
  IF available_slots < required_slots THEN
    RAISE EXCEPTION 'Not enough available time slots for the selected services (needs % slots)', required_slots;
  END IF;

  -- If this is an INSERT or the status is being changed to confirmed
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending') OR 
     (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'confirmed') THEN
    -- Insert blocked slots
    INSERT INTO appointments_blocked_slots (appointment_id, time_slot_id)
    SELECT NEW.id, ts.id
    FROM time_slots ts
    WHERE ts.day_of_week = slot_day_of_week
      AND ts.start_time >= slot_start_time
      AND ts.start_time < (slot_start_time + (interval '30 minutes' * required_slots));
  END IF;
  
  -- All validations passed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_appointment_trigger ON appointments;

-- Create new trigger
CREATE TRIGGER validate_appointment_trigger
  BEFORE INSERT OR UPDATE OF status
  ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment();

-- Function to handle appointment cancellation
CREATE OR REPLACE FUNCTION handle_appointment_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- If the appointment is being cancelled, remove blocked slots
  IF NEW.status = 'cancelled' THEN
    DELETE FROM appointments_blocked_slots
    WHERE appointment_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cancellation handling
CREATE TRIGGER handle_appointment_cancellation_trigger
  AFTER UPDATE OF status
  ON appointments
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled')
  EXECUTE FUNCTION handle_appointment_cancellation();