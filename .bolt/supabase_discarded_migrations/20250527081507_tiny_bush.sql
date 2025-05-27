/*
  # Update Time Slots Schedule

  1. Changes
    - Removes all existing time slots
    - Creates new time slots for Monday through Saturday
    - Sets up 18 thirty-minute slots per day from 8:00 to 17:00
    - Makes all slots available by default

  2. Schedule Details
    - Operating days: Monday through Saturday (no Sunday slots)
    - Operating hours: 8:00 AM to 5:00 PM
    - Slot duration: 30 minutes
    - Total slots per day: 18 slots
*/

-- First, remove all existing time slots
DELETE FROM time_slots;

-- Insert new time slots for each day of the week (except Sunday)
WITH time_ranges AS (
  SELECT 
    generate_series(
      '08:00'::time,
      '16:30'::time,
      '30 minutes'::interval
    ) AS start_time
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
  tr.start_time,
  (tr.start_time + '30 minutes'::interval)::time AS end_time,
  d.day_of_week,
  true AS is_available
FROM time_ranges tr
CROSS JOIN days d
ORDER BY d.day_of_week, tr.start_time;