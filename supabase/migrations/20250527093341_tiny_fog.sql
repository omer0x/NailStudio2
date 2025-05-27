/*
  # Fix Time Slot Blocking

  1. Changes
    - Update validate_appointment() function to block slots for both pending and confirmed appointments
    - Simplify slot validation logic
    - Fix consecutive slot checking
    - Add better error messages

  2. Security
    - Maintains existing RLS policies
    - No changes to permissions
*/

-- Drop existing triggers
DROP TRIGGER IF EXISTS validate_appointment_trigger ON appointments;
DROP TRIGGER IF EXISTS handle_appointment_cancellation_trigger ON appointments;

-- Drop existing functions
DROP FUNCTION IF EXISTS validate_appointment();
DROP FUNCTION IF EXISTS handle_appointment_cancellation();

-- Create new validation function with immediate slot blocking
CREATE OR REPLACE FUNCTION validate_appointment()
RETURNS TRIGGER AS $$
DECLARE
  total_duration INTEGER;
  slot_start_time TIME;
  slot_day_of_week INTEGER;
  required_slots INTEGER;
  available_slots INTEGER;
  consecutive_slots INTEGER := 0;
  current_slot RECORD;
BEGIN
  -- Get total duration of services
  SELECT COALESCE(SUM(s.duration), 0)
  INTO total_duration
  FROM appointment_services as_link
  JOIN services s ON s.id = as_link.service_id
  WHERE as_link.appointment_id = NEW.id;
  
  -- Get initial time slot details
  SELECT start_time, day_of_week
  INTO slot_start_time, slot_day_of_week
  FROM time_slots
  WHERE id = NEW.time_slot_id;
  
  -- Calculate required number of 30-minute slots
  required_slots := CEIL(total_duration::FLOAT / 30);
  
  -- Get all potential slots we need
  FOR current_slot IN (
    SELECT id, start_time
    FROM time_slots
    WHERE day_of_week = slot_day_of_week
      AND start_time >= slot_start_time
    ORDER BY start_time
  ) LOOP
    -- Check if this slot is already booked
    IF EXISTS (
      SELECT 1
      FROM appointments a
      JOIN appointments_blocked_slots abs ON abs.appointment_id = a.id
      WHERE a.date = NEW.date
        AND a.status != 'cancelled'
        AND a.id != NEW.id
        AND abs.time_slot_id = current_slot.id
    ) THEN
      -- Reset consecutive count if slot is booked
      consecutive_slots := 0;
    ELSE
      -- Increment consecutive count if slot is free
      consecutive_slots := consecutive_slots + 1;
    END IF;
    
    -- Stop checking if we found enough consecutive slots
    IF consecutive_slots >= required_slots THEN
      EXIT;
    END IF;
    
    -- Stop if we've gone too far
    IF current_slot.start_time >= slot_start_time + (interval '30 minutes' * required_slots) THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- Verify we found enough consecutive slots
  IF consecutive_slots < required_slots THEN
    RAISE EXCEPTION 'Not enough consecutive time slots available. Need % slots starting from %.', 
      required_slots, 
      slot_start_time;
  END IF;
  
  -- Always block slots for both pending and confirmed appointments
  -- First, remove any existing blocked slots
  DELETE FROM appointments_blocked_slots WHERE appointment_id = NEW.id;
  
  -- Then block all required slots
  INSERT INTO appointments_blocked_slots (appointment_id, time_slot_id)
  SELECT NEW.id, ts.id
  FROM time_slots ts
  WHERE ts.day_of_week = slot_day_of_week
    AND ts.start_time >= slot_start_time
    AND ts.start_time < slot_start_time + (interval '30 minutes' * required_slots)
  ORDER BY ts.start_time;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new appointment validation trigger
CREATE TRIGGER validate_appointment_trigger
  BEFORE INSERT OR UPDATE OF status
  ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment();

-- Create new cancellation function
CREATE OR REPLACE FUNCTION handle_appointment_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove blocked slots when cancelling
  IF NEW.status = 'cancelled' THEN
    DELETE FROM appointments_blocked_slots
    WHERE appointment_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new cancellation trigger
CREATE TRIGGER handle_appointment_cancellation_trigger
  AFTER UPDATE OF status
  ON appointments
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled')
  EXECUTE FUNCTION handle_appointment_cancellation();