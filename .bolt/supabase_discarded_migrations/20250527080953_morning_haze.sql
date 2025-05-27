/*
  # Generate future time slots

  1. Changes
    - Remove existing time slots
    - Generate slots for next 60 days
    - Exclude Sundays and current day
    - 30-minute intervals from 8:00 to 17:00
*/

-- Remove existing time slots
DELETE FROM time_slots;

-- Create function to generate dates
CREATE OR REPLACE FUNCTION generate_dates(start_date DATE, num_days INTEGER)
RETURNS TABLE (date_value DATE) AS $$
BEGIN
  RETURN QUERY
  SELECT d::DATE
  FROM generate_series(start_date, start_date + num_days * INTERVAL '1 day', INTERVAL '1 day') d
  WHERE EXTRACT(DOW FROM d) != 0; -- Exclude Sundays (0 = Sunday)
END;
$$ LANGUAGE plpgsql;

-- Insert time slots for each valid date
INSERT INTO time_slots (start_time, end_time, day_of_week, is_available)
SELECT 
  (t)::TIME as start_time,
  (t + INTERVAL '30 minutes')::TIME as end_time,
  EXTRACT(DOW FROM d.date_value)::INTEGER as day_of_week,
  true as is_available
FROM generate_dates(CURRENT_DATE + INTERVAL '1 day', 60) d
CROSS JOIN generate_series(
  '08:00'::TIME,
  '16:30'::TIME,
  INTERVAL '30 minutes'
) t;

-- Drop the temporary function
DROP FUNCTION generate_dates(DATE, INTEGER);