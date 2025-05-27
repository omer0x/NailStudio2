/*
  # Update time slots to 30-minute intervals
  
  1. Changes
    - Preserve existing time slots that have appointments
    - Remove unused time slots
    - Create new 30-minute interval slots
    - Set slots for Monday through Saturday
  
  2. Safety
    - Maintains referential integrity
    - No data loss for existing appointments
*/

-- Create temporary table to store time slots with appointments
CREATE TEMPORARY TABLE time_slots_with_appointments AS
SELECT DISTINCT ts.id, ts.start_time, ts.end_time, ts.day_of_week, ts.is_available
FROM time_slots ts
INNER JOIN appointments a ON ts.id = a.time_slot_id;

-- Delete time slots that aren't referenced by appointments
DELETE FROM time_slots
WHERE id NOT IN (SELECT id FROM time_slots_with_appointments);

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
      -- Only insert if this exact time slot doesn't exist for this day
      IF NOT EXISTS (
        SELECT 1 
        FROM time_slots 
        WHERE start_time = current_time 
        AND day_of_week = day
      ) THEN
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
      END IF;
      
      -- Increment by 30 minutes
      current_time := current_time + INTERVAL '30 minutes';
    END LOOP;
  END LOOP;
END $$;