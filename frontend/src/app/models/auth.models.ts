export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  profile_photo_url?: string | null;
  email_verified_at?: string | null;
  two_factor_enabled?: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface UserBooking {
  id: number;
  booking_code: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  origin: string;
  destination: string;
  departure_at: string;
  total_amount: number;
  passengers_count: number;
  bus_name: string;
  seats: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}
