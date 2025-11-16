import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'photographer' | 'studio_owner' | 'admin';

export interface User {
  id: string;
  name: string;
  phone_number: string | null;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Studio {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  province: string;
  city: string;
  address: string;
  map_coordinates: { lat: number; lng: number } | null;
  photos: string[];
  verification_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Room {
  id: string;
  studio_id: string;
  name: string;
  description: string | null;
  hourly_price: number;
  daily_price: number;
  features: string[];
  images: string[];
}

export interface Equipment {
  id: string;
  studio_id: string;
  name: string;
  brand: string | null;
  type: string;
  rental_price: number;
  condition: string | null;
  serial_number: string | null;
  barcode_code: string;
  barcode_image_url: string | null;
  status: 'available' | 'rented' | 'damaged';
}

export interface Booking {
  id: string;
  room_id: string;
  photographer_id: string;
  start_time: string;
  end_time: string;
  equipment_ids: string[];
  total_price: number;
  payment_status: 'paid' | 'pending' | 'failed';
  booking_status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}
