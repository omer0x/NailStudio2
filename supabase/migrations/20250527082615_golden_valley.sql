/*
  # Update time slots to 30-minute intervals
  
  1. Changes
    - Delete existing time slots
    - Insert new time slots with 30-minute intervals from 9:00 AM to 7:00 PM
    - Each slot is 30 minutes long
    
  2. Notes
    - Slots are created for Monday through Saturday (Sunday excluded)
    - Default slots are marked as available
*/

-- First, remove existing time slots
DELETE FROM time_slots;

-- Insert new time slots with 30-minute intervals
WITH RECURSIVE
  days AS (
    SELECT generate_series(1, 6) AS day_of_week -- Monday (1) to Saturday (6)
  ),
  times AS (
    SELECT time '09:00' AS start_time
    UNION ALL
    SELECT start_time + interval '30 minutes'
    FROM times
    WHERE start_time < time '18:30' -- Last slot starts at 18:30 to end at 19:00
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