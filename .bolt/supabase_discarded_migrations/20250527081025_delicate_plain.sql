/*
  # Generate Future Time Slots
  
  1. Changes
    - Removes existing time slots
    - Creates time slots for the next 60 days
    - Excludes Sundays and current day
    - Creates 30-minute intervals from 8:00 AM to 4:30 PM
*/

-- Remove existing time slots
DELETE FROM time_slots;

-- Insert time slots for each valid date
WITH RECURSIVE dates AS (
  -- Generate dates for next 60 days, starting tomorrow
  SELECT 
    generate_series(
      CURRENT_DATE + INTERVAL '1 day',
      CURRENT_DATE + INTERVAL '60 days',
      INTERVAL '1 day'
    )::DATE AS date_value
),
valid_dates AS (
  -- Filter out Sundays
  SELECT date_value
  FROM dates
  WHERE EXTRACT(DOW FROM date_value) != 0
),
time_slots AS (
  -- Generate 30-minute intervals
  SELECT generate_series(
    '08:00'::TIME,
    '16:30'::TIME,
    INTERVAL '30 minutes'
  ) AS start_time
)
INSERT INTO time_slots (
  start_time,
  end_time,
  day_of_week,
  is_available
)
SELECT 
  t.start_time,
  (t.start_time + INTERVAL '30 minutes')::TIME,
  EXTRACT(DOW FROM d.date_value)::INTEGER,
  true
FROM valid_dates d
CROSS JOIN time_slots t;