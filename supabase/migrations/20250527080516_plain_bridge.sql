/*
  # Update time slots configuration
  
  1. Changes
    - Delete existing time slots
    - Create new time slots with 30-minute intervals
    - Set slots from 08:00 to 17:00
    - Make slots available for all days except Sunday
    
  2. Details
    - Interval: 30 minutes
    - Operating hours: 08:00 - 17:00
    - Operating days: Monday through Saturday
*/

-- First, remove existing time slots
DELETE FROM time_slots;

-- Create a function to generate time slots
DO $$
DECLARE
  current_time TIME;
  day INT;
BEGIN
  -- Loop through days (1 = Monday to 6 = Saturday)
  FOR day IN 1..6 LOOP
    -- Start at 08:00
    current_time := '08:00:00'::TIME;
    
    -- Create slots until 17:00
    WHILE current_time < '17:00:00'::TIME LOOP
      INSERT INTO time_slots (
        start_time,
        end_time,
        day_of_week,
        is_available
      ) VALUES (
        current_time,
        current_time + INTERVAL '30 minutes',
        day,
        true
      );
      
      -- Increment by 30 minutes
      current_time := current_time + INTERVAL '30 minutes';
    END LOOP;
  END LOOP;
END $$;