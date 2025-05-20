/*
  # Update time slots for business hours

  1. Changes
    - Clear existing time slots
    - Create new time slots for Monday through Saturday
    - Time slots from 08:00 to 17:00
    - 9 slots per day (1 hour each)
    - No slots for Sunday

  2. Details
    - Each slot is 1 hour long
    - Available by default
    - Covers business hours 8 AM to 5 PM
*/

-- First, clear existing time slots
DELETE FROM time_slots;

-- Insert new time slots for each day (except Sunday)
DO $$
DECLARE
  current_day INTEGER;
BEGIN
  -- Loop through days (1 = Monday to 6 = Saturday, skipping 0 = Sunday)
  FOR current_day IN 1..6 LOOP
    -- 08:00
    INSERT INTO time_slots (start_time, end_time, day_of_week, is_available)
    VALUES ('08:00', '09:00', current_day, true);
    
    -- 09:00
    INSERT INTO time_slots (start_time, end_time, day_of_week, is_available)
    VALUES ('09:00', '10:00', current_day, true);
    
    -- 10:00
    INSERT INTO time_slots (start_time, end_time, day_of_week, is_available)
    VALUES ('10:00', '11:00', current_day, true);
    
    -- 11:00
    INSERT INTO time_slots (start_time, end_time, day_of_week, is_available)
    VALUES ('11:00', '12:00', current_day, true);
    
    -- 12:00
    INSERT INTO time_slots (start_time, end_time, day_of_week, is_available)
    VALUES ('12:00', '13:00', current_day, true);
    
    -- 13:00
    INSERT INTO time_slots (start_time, end_time, day_of_week, is_available)
    VALUES ('13:00', '14:00', current_day, true);
    
    -- 14:00
    INSERT INTO time_slots (start_time, end_time, day_of_week, is_available)
    VALUES ('14:00', '15:00', current_day, true);
    
    -- 15:00
    INSERT INTO time_slots (start_time, end_time, day_of_week, is_available)
    VALUES ('15:00', '16:00', current_day, true);
    
    -- 16:00
    INSERT INTO time_slots (start_time, end_time, day_of_week, is_available)
    VALUES ('16:00', '17:00', current_day, true);
  END LOOP;
END $$;