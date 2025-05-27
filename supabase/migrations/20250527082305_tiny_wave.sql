/*
  # Add 30-minute interval time slots
  
  1. Changes
    - Delete existing time slots
    - Insert new time slots with 30-minute intervals
    - Time slots from 09:00 to 19:00
    - Monday through Saturday (Sunday excluded)
*/

-- First, remove existing time slots
DELETE FROM time_slots;

-- Insert new time slots with 30-minute intervals
DO $$
DECLARE
    current_time time;
    day int;
BEGIN
    -- Loop through days (1 = Monday to 6 = Saturday)
    FOR day IN 1..6 LOOP
        -- Start at 09:00
        current_time := '09:00:00'::time;
        
        -- Create slots until 19:00
        WHILE current_time < '19:00:00'::time LOOP
            INSERT INTO time_slots (
                start_time,
                end_time,
                day_of_week,
                is_available
            ) VALUES (
                current_time,
                current_time + interval '30 minutes',
                day,
                true
            );
            
            -- Increment by 30 minutes
            current_time := current_time + interval '30 minutes';
        END LOOP;
    END LOOP;
END $$;