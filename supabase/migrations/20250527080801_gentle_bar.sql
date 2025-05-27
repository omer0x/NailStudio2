/*
  # Update time slots to 30-minute intervals

  1. Changes
    - Removes all existing time slots
    - Creates new time slots from 08:00 to 17:00 with 30-minute intervals
    - Slots available Monday through Saturday (day_of_week 1-6)

  2. Notes
    - Each slot is 30 minutes long
    - All slots are marked as available by default
    - Sunday (day_of_week = 0) is excluded
*/

-- Remove all existing time slots since we confirmed there are no appointments
DELETE FROM time_slots;

-- Create new time slots
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