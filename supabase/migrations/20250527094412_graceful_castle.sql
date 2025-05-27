-- Drop existing triggers
DROP TRIGGER IF EXISTS validate_appointment_trigger ON appointments;
DROP TRIGGER IF EXISTS handle_appointment_cancellation_trigger ON appointments;

-- Drop existing functions
DROP FUNCTION IF EXISTS validate_appointment();
DROP FUNCTION IF EXISTS handle_appointment_cancellation();

-- Create new validation function with improved slot blocking
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
  last_valid_start_time TIME;
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
  
  -- Verify the starting slot exists and is valid
  IF NOT FOUND OR slot_start_time IS NULL THEN
    RAISE EXCEPTION 'Invalid time slot selected';
  END IF;
  
  -- Get all required slots and verify they exist
  FOR current_slot IN (
    SELECT id, start_time
    FROM time_slots ts
    WHERE ts.day_of_week = slot_day_of_week
      AND ts.start_time >= slot_start_time
      AND ts.start_time < slot_start_time + (interval '30 minutes' * required_slots)
    ORDER BY ts.start_time
  ) LOOP
    -- Increment slot count
    slot_count := slot_count + 1;
    
    -- Verify slot is not already booked
    IF EXISTS (
      SELECT 1
      FROM appointments a
      JOIN appointments_blocked_slots abs ON abs.appointment_id = a.id
      WHERE a.date = NEW.date
        AND a.status != 'cancelled'
        AND a.id != NEW.id
        AND abs.time_slot_id = current_slot.id
    ) THEN
      RAISE EXCEPTION 'Time slot % is already booked', to_char(current_slot.start_time, 'HH24:MI');
    END IF;
    
    -- Keep track of the last valid slot
    last_valid_start_time := current_slot.start_time;
  END LOOP;
  
  -- Verify we found all required slots
  IF slot_count < required_slots THEN
    RAISE EXCEPTION 'Not enough consecutive time slots available. Need % slots (% minutes) starting from %', 
      required_slots,
      total_duration,
      to_char(slot_start_time, 'HH24:MI');
  END IF;
  
  -- Verify slots are consecutive by checking the last slot's time
  IF last_valid_start_time != slot_start_time + (interval '30 minutes' * (required_slots - 1)) THEN
    RAISE EXCEPTION 'Time slots are not consecutive from % to %',
      to_char(slot_start_time, 'HH24:MI'),
      to_char(slot_start_time + (interval '30 minutes' * (required_slots - 1)), 'HH24:MI');
  END IF;
  
  -- Block slots immediately for both pending and confirmed appointments
  -- First, remove any existing blocked slots
  DELETE FROM appointments_blocked_slots WHERE appointment_id = NEW.id;
  
  -- Then block all required slots
  WITH RECURSIVE slots AS (
    -- Get all slots we need to block
    SELECT ts.id, ts.start_time, 1 as slot_number
    FROM time_slots ts
    WHERE ts.day_of_week = slot_day_of_week
      AND ts.start_time = slot_start_time
    
    UNION ALL
    
    SELECT ts.id, ts.start_time, s.slot_number + 1
    FROM time_slots ts, slots s
    WHERE ts.day_of_week = slot_day_of_week
      AND ts.start_time = s.start_time + interval '30 minutes'
      AND s.slot_number < required_slots
  )
  INSERT INTO appointments_blocked_slots (appointment_id, time_slot_id)
  SELECT NEW.id, id
  FROM slots
  ORDER BY start_time;
  
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