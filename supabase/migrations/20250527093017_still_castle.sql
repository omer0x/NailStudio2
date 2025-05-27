/*
  # Fix Time Slot Blocking Implementation

  1. Changes
    - Simplify time slot blocking logic
    - Remove complex functions and triggers
    - Implement straightforward slot validation
    - Fix appointment status handling

  2. Details
    - Drop existing complex functions and triggers
    - Create new simplified validation function
    - Update appointment triggers
    - Clean up blocked slots handling
*/

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS validate_appointment_trigger ON appointments;
DROP TRIGGER IF EXISTS handle_appointment_cancellation_trigger ON appointments;
DROP FUNCTION IF EXISTS validate_appointment();
DROP FUNCTION IF EXISTS handle_appointment_cancellation();
DROP FUNCTION IF EXISTS is_time_slot_available();
DROP FUNCTION IF EXISTS get_consecutive_slots();
DROP FUNCTION IF EXISTS calculate_required_slots();
DROP FUNCTION IF EXISTS are_slots_available();
DROP FUNCTION IF EXISTS get_required_time_slots();

-- Create new simplified validation function
CREATE OR REPLACE FUNCTION validate_appointment()
RETURNS TRIGGER AS $$
DECLARE
  total_duration INTEGER;
  slot_start_time TIME;
  slot_day_of_week INTEGER;
  required_slots INTEGER;
  next_slot_id UUID;
  current_slot RECORD;
  slot_count INTEGER := 0;
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
  
  -- Check if we have enough consecutive slots
  FOR current_slot IN (
    SELECT id, start_time
    FROM time_slots
    WHERE day_of_week = slot_day_of_week
      AND start_time >= slot_start_time
      AND start_time < slot_start_time + (interval '30 minutes' * required_slots)
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
      RAISE EXCEPTION 'Time slot % is not available', current_slot.start_time;
    END IF;
    
    slot_count := slot_count + 1;
  END LOOP;
  
  -- Verify we found enough consecutive slots
  IF slot_count < required_slots THEN
    RAISE EXCEPTION 'Not enough consecutive time slots available (need %)', required_slots;
  END IF;
  
  -- For new appointments or when confirming
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'confirmed') THEN
    -- Clear any existing blocked slots
    DELETE FROM appointments_blocked_slots WHERE appointment_id = NEW.id;
    
    -- Block all required slots
    INSERT INTO appointments_blocked_slots (appointment_id, time_slot_id)
    SELECT NEW.id, ts.id
    FROM time_slots ts
    WHERE ts.day_of_week = slot_day_of_week
      AND ts.start_time >= slot_start_time
      AND ts.start_time < slot_start_time + (interval '30 minutes' * required_slots)
    ORDER BY ts.start_time;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new appointment triggers
CREATE TRIGGER validate_appointment_trigger
  BEFORE INSERT OR UPDATE OF status
  ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment();

-- Function to handle appointment cancellation
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

-- Create cancellation trigger
CREATE TRIGGER handle_appointment_cancellation_trigger
  AFTER UPDATE OF status
  ON appointments
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled')
  EXECUTE FUNCTION handle_appointment_cancellation();