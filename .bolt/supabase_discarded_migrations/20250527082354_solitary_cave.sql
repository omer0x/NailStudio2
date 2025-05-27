/*
  # Initial Database Setup

  1. Tables
    - user_profiles: Store user information and admin status
    - services: Available nail services
    - time_slots: Available appointment time slots
    - appointments: Customer appointments
    - appointment_services: Many-to-many relationship between appointments and services

  2. Security
    - Enable RLS on all tables
    - Set up appropriate policies for each table
    - Create helper functions for validation

  3. Indexes
    - Add performance optimization indexes
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  phone text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_admin_lookup ON user_profiles(id, is_admin);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  duration integer NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time time NOT NULL,
  end_time time NOT NULL,
  day_of_week integer NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  time_slot_id uuid NOT NULL REFERENCES time_slots(id),
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT appointments_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled'))
);

-- Create appointment_services table
CREATE TABLE IF NOT EXISTS appointment_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT appointment_services_appointment_id_service_id_key UNIQUE (appointment_id, service_id)
);

-- Create function to ensure user profile exists
CREATE OR REPLACE FUNCTION ensure_user_profile_exists()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = NEW.user_id) THEN
    RAISE EXCEPTION 'User profile does not exist';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate appointment
CREATE OR REPLACE FUNCTION validate_appointment()
RETURNS trigger AS $$
BEGIN
  -- Check if date is not in the past
  IF NEW.date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot book appointments in the past';
  END IF;
  
  -- Check if time slot is available
  IF NOT EXISTS (
    SELECT 1 FROM time_slots 
    WHERE id = NEW.time_slot_id 
    AND is_available = true
  ) THEN
    RAISE EXCEPTION 'Time slot is not available';
  END IF;
  
  -- Check if slot is already booked
  IF EXISTS (
    SELECT 1 FROM appointments 
    WHERE date = NEW.date 
    AND time_slot_id = NEW.time_slot_id 
    AND status != 'cancelled'
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Time slot is already booked';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION check_if_user_is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Enable insert for new users" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = id) AND (is_admin IS NULL OR is_admin = false));

CREATE POLICY "Enable read access" ON user_profiles
  FOR SELECT TO authenticated
  USING ((auth.uid() = id) OR is_admin = true);

CREATE POLICY "Enable update for users" ON user_profiles
  FOR UPDATE TO authenticated
  USING ((auth.uid() = id) OR is_admin = true)
  WITH CHECK (((auth.uid() = id) AND is_admin = false) OR is_admin = true);

-- Create RLS policies for services
CREATE POLICY "Admins can CRUD services" ON services
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Anyone can view active services" ON services
  FOR SELECT TO public
  USING (is_active = true);

-- Create RLS policies for time_slots
CREATE POLICY "Admins can CRUD time slots" ON time_slots
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Anyone can view available time slots" ON time_slots
  FOR SELECT TO public
  USING (is_available = true);

-- Create RLS policies for appointments
CREATE POLICY "Admins can manage all appointments" ON appointments
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Users can create appointments" ON appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    status = 'pending' AND
    date >= CURRENT_DATE
  );

CREATE POLICY "Users can update own pending appointments" ON appointments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (
    auth.uid() = user_id AND
    status = ANY (ARRAY['pending', 'cancelled'])
  );

CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create RLS policies for appointment_services
CREATE POLICY "Admins can manage all appointment services" ON appointment_services
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Users can create appointment services" ON appointment_services
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM appointments
    WHERE id = appointment_services.appointment_id
    AND user_id = auth.uid()
    AND status = 'pending'
  ));

CREATE POLICY "Users can view own appointment services" ON appointment_services
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM appointments
    WHERE id = appointment_services.appointment_id
    AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND is_admin = true
      )
    )
  ));

-- Create appointment triggers
CREATE TRIGGER ensure_user_profile_trigger
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_profile_exists();

CREATE TRIGGER validate_appointment_trigger
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment();

-- Insert initial time slots
DO $$
DECLARE
    current_time time;
    day int;
BEGIN
    -- Loop through days (1 = Monday to 6 = Saturday)
    FOR day IN 1..6 LOOP
        -- Start at 09:00
        current_time := '09:00:00'::time;
        
        -- Create slots until 19:00
        WHILE current_time < '19:00:00'::time LOOP
            INSERT INTO time_slots (
                start_time,
                end_time,
                day_of_week,
                is_available
            ) VALUES (
                current_time,
                current_time + interval '30 minutes',
                day,
                true
            );
            
            -- Increment by 30 minutes
            current_time := current_time + interval '30 minutes';
        END LOOP;
    END LOOP;
END $$;