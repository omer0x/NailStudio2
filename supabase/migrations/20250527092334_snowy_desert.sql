/*
  # Fix appointments table ID type

  1. Changes
    - Change appointments table 'id' column from integer to UUID
    - Add default gen_random_uuid() for id column
    - Update foreign key references in appointment_services table

  2. Security
    - No changes to RLS policies required
    - Existing policies will work with UUID type
*/

-- First, drop the foreign key constraint in appointment_services
ALTER TABLE appointment_services
DROP CONSTRAINT IF EXISTS appointment_services_appointment_id_fkey;

-- Change the id column type to UUID and add default value
ALTER TABLE appointments
ALTER COLUMN id SET DATA TYPE uuid USING id::uuid,
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Re-create the foreign key constraint in appointment_services
ALTER TABLE appointment_services
ADD CONSTRAINT appointment_services_appointment_id_fkey
FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;