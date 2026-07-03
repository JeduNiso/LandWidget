import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  BookingPayload,
  City,
  PaymentPayload,
  PendingBooking,
  Schedule,
  SeatsResponse,
} from '../models/bus.models';

@Injectable({ providedIn: 'root' })
export class BusApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCities(): Observable<City[]> {
    return this.http.get<City[]>(`${this.base}/cities`);
  }

  searchSchedules(params: {
    origin_city_id: number;
    destination_city_id: number;
    departure_date: string;
    passengers: number;
  }): Observable<Schedule[]> {
    const httpParams = new HttpParams({ fromObject: params as any });
    return this.http.get<Schedule[]>(`${this.base}/schedules/search`, { params: httpParams });
  }

  getSeats(scheduleId: number): Observable<SeatsResponse> {
    return this.http.get<SeatsResponse>(`${this.base}/schedules/${scheduleId}/seats`);
  }

  createBooking(payload: BookingPayload): Observable<PendingBooking> {
    return this.http.post<PendingBooking>(`${this.base}/bookings`, payload);
  }

  redirectToPaymentPage(code: string, payload: PaymentPayload): void {
    const endpoint = payload.payment_type === 'sin_otp' ? 'pay-no-otp' : 'pay';
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${this.base}/bookings/${code}/${endpoint}`;
    form.style.display = 'none';

    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'payment_type') return;
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }
}
