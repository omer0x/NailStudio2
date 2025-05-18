/*
  # Initial database schema for Medina Nails Studio

  1. New Tables
    - `user_profiles` - User information and admin status
    - `services` - Available nail services
    - `time_slots` - Available appointment times
    - `appointments` - Customer bookings
    - `appointment_services` - Many-to-many relationship between appointments and services

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Initial Admin
    - Create initial admin user
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot_id UUID NOT NULL REFERENCES time_slots(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create appointment_services junction table
CREATE TABLE IF NOT EXISTS appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(appointment_id, service_id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- Create security policies for user_profiles
CREATE POLICY "Users can view their own profile" 
  ON user_profiles 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON user_profiles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
  ON user_profiles 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create security policies for services
CREATE POLICY "Anyone can view active services" 
  ON services 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can CRUD services" 
  ON services 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create security policies for time_slots
CREATE POLICY "Anyone can view available time slots" 
  ON time_slots 
  FOR SELECT 
  USING (is_available = true);

CREATE POLICY "Admins can CRUD time slots" 
  ON time_slots 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create security policies for appointments
CREATE POLICY "Users can view their own appointments" 
  ON appointments 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments" 
  ON appointments 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending appointments" 
  ON appointments 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all appointments" 
  ON appointments 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update any appointment" 
  ON appointments 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create security policies for appointment_services
CREATE POLICY "Users can view their own appointment services" 
  ON appointment_services 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.id = appointment_id AND appointments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own appointment services" 
  ON appointment_services 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.id = appointment_id AND appointments.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all appointment services" 
  ON appointment_services 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update any appointment service" 
  ON appointment_services 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Insert sample services
INSERT INTO services (name, description, price, duration, image_url, is_active)
VALUES
  ('Classic Manicure', 'Basic nail care with cuticle treatment, shaping, and polish application.', 25, 30, 'https://images.pexels.com/photos/704815/pexels-photo-704815.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', true),
  ('Gel Manicure', 'Long-lasting gel polish application with nail preparation and cuticle care.', 40, 45, 'https://images.pexels.com/photos/939836/pexels-photo-939836.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', true),
  ('Nail Art', 'Express yourself with custom nail art designs from our skilled technicians.', 35, 60, 'https://images.pexels.com/photos/3997391/pexels-photo-3997391.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', true),
  ('Classic Pedicure', 'Relaxing foot soak, exfoliation, nail care, and polish application.', 35, 45, 'https://images.pexels.com/photos/3997387/pexels-photo-3997387.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', true),
  ('Gel Pedicure', 'Complete pedicure treatment with long-lasting gel polish.', 50, 60, 'https://images.pexels.com/photos/3997393/pexels-photo-3997393.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', true),
  ('Acrylic Full Set', 'Full set of acrylic nails with your choice of shape and design.', 60, 90, 'https://images.pexels.com/photos/7755255/pexels-photo-7755255.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', true);

-- Insert sample time slots (Monday-Saturday, 9am-5pm)
-- Monday
INSERT INTO time_slots (start_time, end_time, day_of_week)
VALUES
  ('09:00', '09:30', 1), ('09:30', '10:00', 1), ('10:00', '10:30', 1),
  ('10:30', '11:00', 1), ('11:00', '11:30', 1), ('11:30', '12:00', 1),
  ('13:00', '13:30', 1), ('13:30', '14:00', 1), ('14:00', '14:30', 1),
  ('14:30', '15:00', 1), ('15:00', '15:30', 1), ('15:30', '16:00', 1),
  ('16:00', '16:30', 1), ('16:30', '17:00', 1);

-- Tuesday
INSERT INTO time_slots (start_time, end_time, day_of_week)
VALUES
  ('09:00', '09:30', 2), ('09:30', '10:00', 2), ('10:00', '10:30', 2),
  ('10:30', '11:00', 2), ('11:00', '11:30', 2), ('11:30', '12:00', 2),
  ('13:00', '13:30', 2), ('13:30', '14:00', 2), ('14:00', '14:30', 2),
  ('14:30', '15:00', 2), ('15:00', '15:30', 2), ('15:30', '16:00', 2),
  ('16:00', '16:30', 2), ('16:30', '17:00', 2);

-- Wednesday
INSERT INTO time_slots (start_time, end_time, day_of_week)
VALUES
  ('09:00', '09:30', 3), ('09:30', '10:00', 3), ('10:00', '10:30', 3),
  ('10:30', '11:00', 3), ('11:00', '11:30', 3), ('11:30', '12:00', 3),
  ('13:00', '13:30', 3), ('13:30', '14:00', 3), ('14:00', '14:30', 3),
  ('14:30', '15:00', 3), ('15:00', '15:30', 3), ('15:30', '16:00', 3),
  ('16:00', '16:30', 3), ('16:30', '17:00', 3);

-- Thursday
INSERT INTO time_slots (start_time, end_time, day_of_week)
VALUES
  ('09:00', '09:30', 4), ('09:30', '10:00', 4), ('10:00', '10:30', 4),
  ('10:30', '11:00', 4), ('11:00', '11:30', 4), ('11:30', '12:00', 4),
  ('13:00', '13:30', 4), ('13:30', '14:00', 4), ('14:00', '14:30', 4),
  ('14:30', '15:00', 4), ('15:00', '15:30', 4), ('15:30', '16:00', 4),
  ('16:00', '16:30', 4), ('16:30', '17:00', 4);

-- Friday
INSERT INTO time_slots (start_time, end_time, day_of_week)
VALUES
  ('09:00', '09:30', 5), ('09:30', '10:00', 5), ('10:00', '10:30', 5),
  ('10:30', '11:00', 5), ('11:00', '11:30', 5), ('11:30', '12:00', 5),
  ('13:00', '13:30', 5), ('13:30', '14:00', 5), ('14:00', '14:30', 5),
  ('14:30', '15:00', 5), ('15:00', '15:30', 5), ('15:30', '16:00', 5),
  ('16:00', '16:30', 5), ('16:30', '17:00', 5);

-- Saturday
INSERT INTO time_slots (start_time, end_time, day_of_week)
VALUES
  ('09:00', '09:30', 6), ('09:30', '10:00', 6), ('10:00', '10:30', 6),
  ('10:30', '11:00', 6), ('11:00', '11:30', 6), ('11:30', '12:00', 6),
  ('13:00', '13:30', 6), ('13:30', '14:00', 6), ('14:00', '14:30', 6),
  ('14:30', '15:00', 6), ('15:00', '15:30', 6), ('15:30', '16:00', 6),
  ('16:00', '16:30', 6), ('16:30', '17:00', 6);