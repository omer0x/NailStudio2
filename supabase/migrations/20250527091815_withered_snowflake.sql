/*
  # Fix Time Slot Blocking

  1. Changes
    - Update the query that checks for available time slots to consider all blocked slots
    - Add a function to check if a time slot is available
    - Update the validation function to use the new availability check

  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- Function to check if a time slot is available
CREATE OR REPLACE FUNCTION is_time_slot_available(
  p_date DATE,
  p_time_slot_id UUID,
  p_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM appointments a
    JOIN appointments_blocked_slots abs ON abs.appointment_id = a.id
    WHERE a.date = p_date
      AND abs.time_slot_id = p_time_slot_id
      AND a.status != 'cancelled'
      AND (p_appointment_id IS NULL OR a.id != p_appointment_id)
  );
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
  all_slots_available BOOLEAN;
  slot_record RECORD;
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
  
  -- Check if all required slots are available
  all_slots_available := true;
  FOR slot_record IN (
    SELECT ts.id
    FROM time_slots ts
    WHERE ts.day_of_week = slot_day_of_week
      AND ts.is_available = true
      AND ts.start_time >= slot_start_time
      AND ts.start_time < (slot_start_time + (interval '30 minutes' * required_slots))
    ORDER BY ts.start_time
  ) LOOP
    IF NOT is_time_slot_available(NEW.date, slot_record.id, NEW.id) THEN
      all_slots_available := false;
      EXIT;
    END IF;
  END LOOP;

  -- Validate the appointment
  IF NOT all_slots_available THEN
    RAISE EXCEPTION 'The selected time slots are not available';
  END IF;

  -- If this is an INSERT or the status is being changed to confirmed
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'confirmed') THEN
    -- Delete any existing blocked slots for this appointment
    DELETE FROM appointments_blocked_slots WHERE appointment_id = NEW.id;
    
    -- Insert blocked slots for all required time slots
    INSERT INTO appointments_blocked_slots (appointment_id, time_slot_id)
    SELECT NEW.id, ts.id
    FROM time_slots ts
    WHERE ts.day_of_week = slot_day_of_week
      AND ts.is_available = true
      AND ts.start_time >= slot_start_time
      AND ts.start_time < (slot_start_time + (interval '30 minutes' * required_slots))
    ORDER BY ts.start_time;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;