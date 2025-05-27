-- Drop existing triggers
DROP TRIGGER IF EXISTS validate_appointment_trigger ON appointments;
DROP TRIGGER IF EXISTS handle_appointment_cancellation_trigger ON appointments;

-- Drop existing functions
DROP FUNCTION IF EXISTS validate_appointment();
DROP FUNCTION IF EXISTS handle_appointment_cancellation();

-- Create new validation function with simplified slot blocking
CREATE OR REPLACE FUNCTION validate_appointment()
RETURNS TRIGGER AS $$
DECLARE
  total_duration INTEGER;
  slot_start_time TIME;
  slot_day_of_week INTEGER;
  required_slots INTEGER;
  slot_count INTEGER := 0;
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
  
  -- Verify the starting slot exists and is valid
  IF NOT FOUND OR slot_start_time IS NULL THEN
    RAISE EXCEPTION 'Invalid time slot selected';
  END IF;
  
  -- Check if any required slots are already booked
  FOR current_slot IN (
    SELECT ts.id, ts.start_time
    FROM time_slots ts
    WHERE ts.day_of_week = slot_day_of_week
      AND ts.start_time >= slot_start_time
      AND ts.start_time < slot_start_time + (interval '30 minutes' * required_slots)
    ORDER BY ts.start_time
  ) LOOP
    -- Check if slot is booked
    IF EXISTS (
      SELECT 1
      FROM appointments a
      JOIN appointments_blocked_slots abs ON abs.appointment_id = a.id
      WHERE a.date = NEW.date
        AND a.status != 'cancelled'
        AND a.id != NEW.id
        AND abs.time_slot_id = current_slot.id
    ) THEN
      RAISE EXCEPTION 'Time slot % is not available', to_char(current_slot.start_time, 'HH24:MI');
    END IF;
    
    slot_count := slot_count + 1;
  END LOOP;
  
  -- Verify we have enough consecutive slots
  IF slot_count < required_slots THEN
    RAISE EXCEPTION 'Not enough consecutive time slots available. Need % slots (% minutes)', 
      required_slots, total_duration;
  END IF;
  
  -- For new appointments or when confirming, block the slots
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status != 'cancelled') THEN
    -- Remove any existing blocked slots
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

-- Create new appointment validation trigger
CREATE TRIGGER validate_appointment_trigger
  BEFORE INSERT OR UPDATE
  ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment();

-- Create new cancellation function
CREATE OR REPLACE FUNCTION handle_appointment_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove blocked slots when cancelling
  IF NEW.status = 'cancelled' THEN
    DELETE FROM appointments_blocked_slots WHERE appointment_id = NEW.id;
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