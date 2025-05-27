/*
  # Update appointments ID to UUID
  
  1. Changes
    - Change appointments.id column type from bigint to UUID
    - Add gen_random_uuid() as default value
    - Temporarily drop and recreate all dependent policies
    - Update foreign key constraints
  
  2. Security
    - Preserves all existing RLS policies
    - Maintains referential integrity
*/

-- Temporarily disable RLS policies for appointment_services
DROP POLICY IF EXISTS "Users can create appointment services" ON appointment_services;
DROP POLICY IF EXISTS "Users can view own appointment services" ON appointment_services;
DROP POLICY IF EXISTS "Admins can manage all appointment services" ON appointment_services;

-- Temporarily disable RLS policies for appointments_blocked_slots
DROP POLICY IF EXISTS "Users can create blocked slots for their appointments" ON appointments_blocked_slots;
DROP POLICY IF EXISTS "Users can view their blocked slots" ON appointments_blocked_slots;
DROP POLICY IF EXISTS "Admins can manage blocked slots" ON appointments_blocked_slots;

-- Drop foreign key constraints
ALTER TABLE appointment_services
DROP CONSTRAINT IF EXISTS appointment_services_appointment_id_fkey;

ALTER TABLE appointments_blocked_slots
DROP CONSTRAINT IF EXISTS appointments_blocked_slots_appointment_id_fkey;

-- Change the id column type to UUID and add default value
ALTER TABLE appointments
ALTER COLUMN id SET DATA TYPE uuid USING id::uuid,
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Re-create foreign key constraints
ALTER TABLE appointment_services
ADD CONSTRAINT appointment_services_appointment_id_fkey
FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;

ALTER TABLE appointments_blocked_slots
ADD CONSTRAINT appointments_blocked_slots_appointment_id_fkey
FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;

-- Re-create appointment_services policies
CREATE POLICY "Users can create appointment services"
ON appointment_services
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.id = appointment_services.appointment_id
    AND appointments.user_id = auth.uid()
    AND appointments.status = 'pending'
  )
);

CREATE POLICY "Users can view own appointment services"
ON appointment_services
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.id = appointment_services.appointment_id
    AND (
      appointments.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_admin = true
      )
    )
  )
);

CREATE POLICY "Admins can manage all appointment services"
ON appointment_services
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  )
);

-- Re-create appointments_blocked_slots policies
CREATE POLICY "Users can create blocked slots for their appointments"
ON appointments_blocked_slots
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.id = appointments_blocked_slots.appointment_id
    AND appointments.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their blocked slots"
ON appointments_blocked_slots
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.id = appointments_blocked_slots.appointment_id
    AND appointments.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage blocked slots"
ON appointments_blocked_slots
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  )
);