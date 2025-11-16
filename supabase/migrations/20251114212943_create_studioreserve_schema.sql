/*
  # StudioReserve Complete Database Schema

  ## Overview
  This migration creates the complete database schema for StudioReserve, a studio reservation,
  equipment rental, and barcode tracking platform for photographers and videographers in Iran.

  ## New Tables

  ### 1. users
  Extended user profile table with role-based access
  - `id` (uuid, FK to auth.users)
  - `name` (text)
  - `phone_number` (text, unique)
  - `email` (text, unique)
  - `role` (text: studio_owner | photographer | admin)
  - `avatar_url` (text, nullable)
  - `created_at` (timestamptz)

  ### 2. studios
  Studio listings created by studio owners
  - `id` (uuid, PK)
  - `owner_id` (uuid, FK to users)
  - `name` (text)
  - `description` (text)
  - `province` (text)
  - `city` (text)
  - `address` (text)
  - `map_coordinates` (jsonb: {lat, lng})
  - `photos` (text[])
  - `verification_status` (text: pending | approved | rejected)
  - `created_at` (timestamptz)

  ### 3. rooms
  Individual rooms within studios
  - `id` (uuid, PK)
  - `studio_id` (uuid, FK to studios)
  - `name` (text)
  - `description` (text)
  - `hourly_price` (numeric)
  - `daily_price` (numeric)
  - `features` (text[])
  - `images` (text[])

  ### 4. room_availability
  Time slot availability for rooms by date
  - `id` (uuid, PK)
  - `room_id` (uuid, FK to rooms)
  - `date` (date)
  - `time_slots` (jsonb[]: [{time, status}])

  ### 5. equipment
  Studio equipment inventory with barcode tracking
  - `id` (uuid, PK)
  - `studio_id` (uuid, FK to studios)
  - `name` (text)
  - `brand` (text)
  - `type` (text)
  - `rental_price` (numeric)
  - `condition` (text)
  - `serial_number` (text)
  - `barcode_code` (text, unique)
  - `barcode_image_url` (text)
  - `status` (text: available | rented | damaged)

  ### 6. equipment_logs
  Tracking equipment check-out and check-in
  - `id` (uuid, PK)
  - `equipment_id` (uuid, FK to equipment)
  - `user_id` (uuid, FK to users)
  - `action` (text: scan_out | scan_in)
  - `timestamp` (timestamptz)
  - `notes` (text)

  ### 7. bookings
  Room bookings with equipment rentals
  - `id` (uuid, PK)
  - `room_id` (uuid, FK to rooms)
  - `photographer_id` (uuid, FK to users)
  - `start_time` (timestamptz)
  - `end_time` (timestamptz)
  - `equipment_ids` (uuid[])
  - `total_price` (numeric)
  - `payment_status` (text: paid | pending | failed)
  - `booking_status` (text: pending | accepted | rejected | completed | cancelled)
  - `created_at` (timestamptz)

  ### 8. payments
  Payment transaction records
  - `id` (uuid, PK)
  - `booking_id` (uuid, FK to bookings)
  - `amount` (numeric)
  - `gateway` (text: Zarinpal | IDPay | NextPay)
  - `status` (text)
  - `transaction_id` (text)
  - `timestamp` (timestamptz)

  ### 9. notifications
  User notifications
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to users)
  - `title` (text)
  - `message` (text)
  - `type` (text)
  - `read` (boolean)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Role-based policies for photographers, studio owners, and admins
  - Strict ownership and membership checks
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone_number text UNIQUE,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('studio_owner', 'photographer', 'admin')),
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Studios table
CREATE TABLE IF NOT EXISTS studios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  province text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  map_coordinates jsonb,
  photos text[] DEFAULT '{}',
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE studios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved studios"
  ON studios FOR SELECT
  TO authenticated
  USING (verification_status = 'approved' OR owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Studio owners can create studios"
  ON studios FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'studio_owner')
  );

CREATE POLICY "Studio owners can update own studios"
  ON studios FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can update any studio"
  ON studios FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid REFERENCES studios(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  hourly_price numeric NOT NULL CHECK (hourly_price >= 0),
  daily_price numeric NOT NULL CHECK (daily_price >= 0),
  features text[] DEFAULT '{}',
  images text[] DEFAULT '{}'
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rooms of approved studios"
  ON rooms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM studios 
      WHERE studios.id = rooms.studio_id 
      AND (studios.verification_status = 'approved' OR studios.owner_id = auth.uid())
    )
  );

CREATE POLICY "Studio owners can manage own rooms"
  ON rooms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM studios 
      WHERE studios.id = rooms.studio_id 
      AND studios.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM studios 
      WHERE studios.id = rooms.studio_id 
      AND studios.owner_id = auth.uid()
    )
  );

-- Room availability table
CREATE TABLE IF NOT EXISTS room_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  time_slots jsonb DEFAULT '[]',
  UNIQUE(room_id, date)
);

ALTER TABLE room_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view room availability"
  ON room_availability FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Studio owners can manage own room availability"
  ON room_availability FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms 
      JOIN studios ON studios.id = rooms.studio_id
      WHERE rooms.id = room_availability.room_id 
      AND studios.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms 
      JOIN studios ON studios.id = rooms.studio_id
      WHERE rooms.id = room_availability.room_id 
      AND studios.owner_id = auth.uid()
    )
  );

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid REFERENCES studios(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  brand text,
  type text NOT NULL,
  rental_price numeric NOT NULL CHECK (rental_price >= 0),
  condition text DEFAULT 'good',
  serial_number text,
  barcode_code text UNIQUE NOT NULL,
  barcode_image_url text,
  status text DEFAULT 'available' CHECK (status IN ('available', 'rented', 'damaged'))
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available equipment"
  ON equipment FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM studios 
      WHERE studios.id = equipment.studio_id 
      AND (studios.verification_status = 'approved' OR studios.owner_id = auth.uid())
    )
  );

CREATE POLICY "Studio owners can manage own equipment"
  ON equipment FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM studios 
      WHERE studios.id = equipment.studio_id 
      AND studios.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM studios 
      WHERE studios.id = equipment.studio_id 
      AND studios.owner_id = auth.uid()
    )
  );

-- Equipment logs table
CREATE TABLE IF NOT EXISTS equipment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid REFERENCES equipment(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL CHECK (action IN ('scan_out', 'scan_in')),
  timestamp timestamptz DEFAULT now(),
  notes text
);

ALTER TABLE equipment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for their studios or bookings"
  ON equipment_logs FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM equipment 
      JOIN studios ON studios.id = equipment.studio_id
      WHERE equipment.id = equipment_logs.equipment_id 
      AND studios.owner_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Users can create equipment logs"
  ON equipment_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM equipment 
      JOIN studios ON studios.id = equipment.studio_id
      WHERE equipment.id = equipment_logs.equipment_id 
      AND studios.owner_id = auth.uid()
    )
  );

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  photographer_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  equipment_ids uuid[] DEFAULT '{}',
  total_price numeric NOT NULL CHECK (total_price >= 0),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'failed')),
  booking_status text DEFAULT 'pending' CHECK (booking_status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = photographer_id OR
    EXISTS (
      SELECT 1 FROM rooms 
      JOIN studios ON studios.id = rooms.studio_id
      WHERE rooms.id = bookings.room_id 
      AND studios.owner_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Photographers can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = photographer_id AND
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('photographer', 'studio_owner'))
  );

CREATE POLICY "Photographers can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = photographer_id)
  WITH CHECK (auth.uid() = photographer_id);

CREATE POLICY "Studio owners can update bookings for own rooms"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms 
      JOIN studios ON studios.id = rooms.studio_id
      WHERE rooms.id = bookings.room_id 
      AND studios.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms 
      JOIN studios ON studios.id = rooms.studio_id
      WHERE rooms.id = bookings.room_id 
      AND studios.owner_id = auth.uid()
    )
  );

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  gateway text NOT NULL CHECK (gateway IN ('Zarinpal', 'IDPay', 'NextPay')),
  status text NOT NULL,
  transaction_id text,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = payments.booking_id 
      AND bookings.photographer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM bookings 
      JOIN rooms ON rooms.id = bookings.room_id
      JOIN studios ON studios.id = rooms.studio_id
      WHERE bookings.id = payments.booking_id 
      AND studios.owner_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "System can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = payments.booking_id 
      AND bookings.photographer_id = auth.uid()
    )
  );

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_studios_verification ON studios(verification_status);
CREATE INDEX IF NOT EXISTS idx_studios_city ON studios(city);
CREATE INDEX IF NOT EXISTS idx_rooms_studio ON rooms(studio_id);
CREATE INDEX IF NOT EXISTS idx_equipment_studio ON equipment(studio_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_barcode ON equipment(barcode_code);
CREATE INDEX IF NOT EXISTS idx_bookings_photographer ON bookings(photographer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
