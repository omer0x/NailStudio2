/*
  # Add duration-based appointment validation

  1. New Function
    - Creates a function to validate appointment time slots based on service durations
    - Checks for overlapping appointments
    - Ensures enough time slots are available for the service duration
    
  2. Changes
    - Updates the validate_appointment trigger function to include duration checks
    - Adds validation for overlapping appointments
*/

-- Function to calculate total duration and validate time slots
CREATE OR REPLACE FUNCTION validate_appointment()
RETURNS TRIGGER AS $$
DECLARE
  total_duration INTEGER;
  slot_start_time TIME;
  slot_end_time TIME;
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
  SELECT start_time, end_time
  INTO slot_start_time, slot_end_time
  FROM time_slots
  WHERE id = NEW.time_slot_id;
  
  -- Calculate how many 30-minute slots we need
  required_slots := CEIL(total_duration::FLOAT / 30);
  
  -- Check for overlapping appointments
  SELECT COUNT(*)
  INTO overlapping_count
  FROM appointments a
  JOIN time_slots ts ON ts.id = a.time_slot_id
  WHERE a.date = NEW.date
    AND a.id != NEW.id
    AND a.status != 'cancelled'
    AND ts.start_time >= slot_start_time
    AND ts.start_time < (slot_start_time + (interval '30 minutes' * required_slots));
  
  -- Validate the appointment
  IF overlapping_count > 0 THEN
    RAISE EXCEPTION 'The selected time slot overlaps with existing appointments';
  END IF;
  
  -- Check if we have enough consecutive available slots
  SELECT COUNT(*)
  INTO available_slots
  FROM time_slots ts
  WHERE ts.day_of_week = EXTRACT(DOW FROM NEW.date)
    AND ts.is_available = true
    AND ts.start_time >= slot_start_time
    AND ts.start_time < (slot_start_time + (interval '30 minutes' * required_slots));
    
  IF available_slots < required_slots THEN
    RAISE EXCEPTION 'Not enough available time slots for the selected services (needs % slots)', required_slots;
  END IF;
  
  -- All validations passed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;