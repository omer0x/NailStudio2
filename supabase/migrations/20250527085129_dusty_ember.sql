/*
  # Fix appointment time slot blocking

  1. Changes
    - Update validate_appointment function to properly handle blocked slots
    - Add function to get required time slots for an appointment
    - Improve validation logic for overlapping appointments

  2. Security
    - Maintain existing RLS policies
    - No changes to table permissions
*/

-- Function to get all required time slot IDs for an appointment
CREATE OR REPLACE FUNCTION get_required_time_slots(
  p_start_time TIME,
  p_day_of_week INTEGER,
  p_duration INTEGER
)
RETURNS TABLE (slot_id UUID) AS $$
DECLARE
  required_slots INTEGER;
BEGIN
  -- Calculate how many 30-minute slots we need
  required_slots := CEIL(p_duration::FLOAT / 30);
  
  RETURN QUERY
  SELECT ts.id
  FROM time_slots ts
  WHERE ts.day_of_week = p_day_of_week
    AND ts.start_time >= p_start_time
    AND ts.start_time < (p_start_time + (interval '30 minutes' * required_slots))
  ORDER BY ts.start_time;
END;
$$ LANGUAGE plpgsql;

-- Update the validate_appointment function
CREATE OR REPLACE FUNCTION validate_appointment()
RETURNS TRIGGER AS $$
DECLARE
  total_duration INTEGER;
  slot_start_time TIME;
  slot_day_of_week INTEGER;
  required_slots INTEGER;
  available_slots INTEGER;
  overlapping_count INTEGER;
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
  
  -- Check for overlapping appointments using the required time slots
  SELECT COUNT(*)
  INTO overlapping_count
  FROM appointments a
  JOIN appointments_blocked_slots abs ON abs.appointment_id = a.id
  WHERE a.date = NEW.date
    AND a.id != NEW.id
    AND a.status != 'cancelled'
    AND abs.time_slot_id IN (
      SELECT slot_id 
      FROM get_required_time_slots(slot_start_time, slot_day_of_week, total_duration)
    );
  
  -- Validate the appointment
  IF overlapping_count > 0 THEN
    RAISE EXCEPTION 'The selected time slots are not available (overlap with existing appointments)';
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
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'confirmed') THEN
    -- Insert blocked slots for all required time slots
    INSERT INTO appointments_blocked_slots (appointment_id, time_slot_id)
    SELECT NEW.id, slot_id
    FROM get_required_time_slots(slot_start_time, slot_day_of_week, total_duration);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;