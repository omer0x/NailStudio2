/*
  # Fix Appointment Slot Blocking

  1. Changes
    - Adds function to calculate required slots based on service duration
    - Updates validate_appointment function to block all required slots
    - Improves validation to check all required slots are available
    - Adds function to check slot availability

  2. Security
    - Maintains existing RLS policies
    - No changes to table permissions
*/

-- Function to calculate required slots for a service duration
CREATE OR REPLACE FUNCTION calculate_required_slots(p_duration INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN CEIL(p_duration::FLOAT / 30);
END;
$$ LANGUAGE plpgsql;

-- Function to get consecutive time slots
CREATE OR REPLACE FUNCTION get_consecutive_slots(
  p_start_slot_id UUID,
  p_count INTEGER
)
RETURNS TABLE (slot_id UUID, slot_order INTEGER) AS $$
DECLARE
  v_start_time TIME;
  v_day_of_week INTEGER;
BEGIN
  -- Get the starting slot details
  SELECT start_time, day_of_week 
  INTO v_start_time, v_day_of_week
  FROM time_slots 
  WHERE id = p_start_slot_id;
  
  RETURN QUERY
  SELECT 
    ts.id,
    ROW_NUMBER() OVER (ORDER BY ts.start_time) - 1 AS slot_order
  FROM time_slots ts
  WHERE ts.day_of_week = v_day_of_week
    AND ts.start_time >= v_start_time
    AND ts.start_time < v_start_time + (interval '30 minutes' * p_count)
  ORDER BY ts.start_time
  LIMIT p_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if slots are available
CREATE OR REPLACE FUNCTION are_slots_available(
  p_start_slot_id UUID,
  p_required_slots INTEGER,
  p_date DATE,
  p_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available BOOLEAN := true;
  v_slot RECORD;
BEGIN
  FOR v_slot IN (
    SELECT slot_id
    FROM get_consecutive_slots(p_start_slot_id, p_required_slots)
  ) LOOP
    IF EXISTS (
      SELECT 1
      FROM appointments a
      JOIN appointments_blocked_slots abs ON abs.appointment_id = a.id
      WHERE a.date = p_date
        AND abs.time_slot_id = v_slot.slot_id
        AND a.status != 'cancelled'
        AND (p_appointment_id IS NULL OR a.id != p_appointment_id)
    ) THEN
      v_available := false;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_available;
END;
$$ LANGUAGE plpgsql;

-- Update the validate_appointment function
CREATE OR REPLACE FUNCTION validate_appointment()
RETURNS TRIGGER AS $$
DECLARE
  v_total_duration INTEGER;
  v_required_slots INTEGER;
  v_slot RECORD;
BEGIN
  -- Calculate total duration of services
  SELECT COALESCE(SUM(s.duration), 0)
  INTO v_total_duration
  FROM appointment_services as_link
  JOIN services s ON s.id = as_link.service_id
  WHERE as_link.appointment_id = NEW.id;
  
  -- Calculate required number of slots
  v_required_slots := calculate_required_slots(v_total_duration);
  
  -- Check if all required slots are available
  IF NOT are_slots_available(NEW.time_slot_id, v_required_slots, NEW.date, NEW.id) THEN
    RAISE EXCEPTION 'Required time slots are not available';
  END IF;

  -- For new appointments or status changes to confirmed
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'confirmed') THEN
    -- Remove any existing blocked slots
    DELETE FROM appointments_blocked_slots WHERE appointment_id = NEW.id;
    
    -- Block all required slots
    INSERT INTO appointments_blocked_slots (appointment_id, time_slot_id)
    SELECT NEW.id, slot_id
    FROM get_consecutive_slots(NEW.time_slot_id, v_required_slots);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;