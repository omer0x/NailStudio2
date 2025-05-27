/*
  # Fix appointments_blocked_slots RLS policies

  1. Changes
    - Add insert policy for appointments_blocked_slots table to allow users to create blocked slots for their own appointments
  
  2. Security
    - Users can only insert blocked slots for appointments they own
    - Maintains existing policies for admin access and viewing
*/

-- Add insert policy for appointments_blocked_slots
CREATE POLICY "Users can create blocked slots for their appointments"
ON appointments_blocked_slots
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.id = appointment_id
    AND appointments.user_id = auth.uid()
  )
);