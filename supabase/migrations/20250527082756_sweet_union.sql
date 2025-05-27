/*
  # Update business hours

  1. Changes
    - Remove existing time slots
    - Create new slots from 8:00 AM to 5:00 PM
    - 30-minute intervals
    - Monday through Saturday
    
  2. Details
    - First slot: 8:00 AM
    - Last slot: 4:30 PM (ends at 5:00 PM)
    - All slots set as available by default
*/

-- First, remove existing time slots
DELETE FROM time_slots;

-- Insert new time slots with 30-minute intervals
WITH RECURSIVE
  days AS (
    SELECT generate_series(1, 6) AS day_of_week -- Monday (1) to Saturday (6)
  ),
  times AS (
    SELECT time '08:00' AS start_time
    UNION ALL
    SELECT start_time + interval '30 minutes'
    FROM times
    WHERE start_time < time '16:30' -- Last slot starts at 16:30 to end at 17:00
  )
INSERT INTO time_slots (start_time, end_time, day_of_week, is_available)
SELECT 
  start_time,
  start_time + interval '30 minutes' as end_time,
  day_of_week,
  true as is_available
FROM days
CROSS JOIN times
ORDER BY day_of_week, start_time;