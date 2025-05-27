/*
  # Create time slots

  1. Changes
    - Removes all existing time slots
    - Creates new time slots for Monday through Saturday
    - Sets up slots from 8:00 to 17:00 with 30-minute intervals
    - Makes all slots available by default

  2. Details
    - Slots for Monday (1) through Saturday (6)
    - No slots on Sunday
    - Each slot is 30 minutes
    - All slots marked as available
*/

-- First, remove all existing time slots
DELETE FROM time_slots;

-- Insert new time slots for each day of the week (except Sunday)
WITH RECURSIVE time_slots_series AS (
  -- Start with 8:00
  SELECT '08:00'::time AS slot_time
  UNION ALL
  -- Generate subsequent times until 16:30 (last slot will be 16:30-17:00)
  SELECT (slot_time + interval '30 minutes')::time
  FROM time_slots_series
  WHERE slot_time < '16:30'::time
),
days AS (
  SELECT generate_series(1, 6) AS day_of_week -- Monday (1) through Saturday (6)
)
INSERT INTO time_slots (
  start_time,
  end_time,
  day_of_week,
  is_available
)
SELECT
  slot_time AS start_time,
  (slot_time + interval '30 minutes')::time AS end_time,
  d.day_of_week,
  true AS is_available
FROM time_slots_series
CROSS JOIN days d
ORDER BY d.day_of_week, slot_time;