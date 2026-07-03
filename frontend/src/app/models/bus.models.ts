export interface City {
  id: number;
  name: string;
  code: string;
}

export interface Schedule {
  id: number;
  bus_name: string;
  bus_type: string;
  departure_at: string;
  arrival_at: string;
  price: number;
  total_seats: number;
  available_seats: number;
  origin_city: string;
  destination_city: string;
  duration_minutes: number;
}

export interface Seat {
  id: number;
  seat_number: string;
  deck: string;
  is_reserved: boolean;
}

export interface SeatsResponse {
  schedule_id: number;
  bus_type: string;
  total_seats: number;
  seats: Seat[];
}

export interface PassengerPayload {
  seat_id: number;
  first_name: string;
  last_name: string;
  document_type: string;
  document_number: string;
}

export interface BookingPayload {
  schedule_id: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  passengers: PassengerPayload[];
}

/** Respuesta del POST /api/bookings (estado pending, listo para pagar) */
export interface PendingBooking {
  booking_code: string;
  status: string;
  total_amount: number;
  contact_email: string;
  origin: string;
  destination: string;
  departure_at: string;
  bus_name: string;
  seats: string;
  passengers_count: number;
}

export interface PaymentPayload {
  card_number: string;
  cardholder_name: string;
  expiry_month: number;
  expiry_year: number;
  cvv: string;
  billing_locality: string;
  billing_address1: string;
  billing_email: string;
  billing_phone: string;
  payment_type: 'otp' | 'sin_otp';
}

export interface BookingConfirmation {
  booking_code: string;
  status: string;
  total_amount: number;
  contact_email: string;
  origin: string;
  destination: string;
  departure_at: string;
  passengers: {
    first_name: string;
    last_name: string;
    seat_number: string;
    document_type: string;
    document_number: string;
  }[];
}
