/*
  # Fix appointments table ID type

  1. Changes
    - Convert appointments.id column from integer to UUID
    - Update foreign key constraints
    - Preserve RLS policies
  
  2. Implementation
    - Temporarily disable RLS policies
    - Modify column type
    - Restore policies
*/

-- Temporarily disable RLS policies
DROP POLICY IF EXISTS "Users can create appointment services" ON appointment_services;
DROP POLICY IF EXISTS "Users can view own appointment services" ON appointment_services;
DROP POLICY IF EXISTS "Admins can manage all appointment services" ON appointment_services;

-- Drop the foreign key constraint
ALTER TABLE appointment_services
DROP CONSTRAINT IF EXISTS appointment_services_appointment_id_fkey;

-- Change the id column type to UUID and add default value
ALTER TABLE appointments
ALTER COLUMN id SET DATA TYPE uuid USING id::uuid,
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Re-create the foreign key constraint
ALTER TABLE appointment_services
ADD CONSTRAINT appointment_services_appointment_id_fkey
FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;

-- Re-create the policies
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