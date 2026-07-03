import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchFormComponent, SearchParams } from '../search-form/search-form.component';
import { ScheduleListComponent } from '../schedule-list/schedule-list.component';
import { SeatSelectorComponent } from '../seat-selector/seat-selector.component';
import { PassengerFormComponent } from '../passenger-form/passenger-form.component';
import { BookingConfirmationComponent } from '../booking-confirmation/booking-confirmation.component';
import { PaymentFormComponent } from '../payment-form/payment-form.component';
import { BusApiService } from '../../services/bus-api.service';
import {
  BookingConfirmation,
  BookingPayload,
  PendingBooking,
  PaymentPayload,
  Schedule,
  Seat,
} from '../../models/bus.models';

type Step = 'search' | 'schedules' | 'seats' | 'passengers' | 'payment' | 'confirmation';

@Component({
  selector: 'app-bus-widget',
  standalone: true,
  imports: [
    CommonModule,
    SearchFormComponent,
    ScheduleListComponent,
    SeatSelectorComponent,
    PassengerFormComponent,
    PaymentFormComponent,
    BookingConfirmationComponent,
  ],
  templateUrl: './bus-widget.component.html',
  styleUrls: ['./bus-widget.component.scss'],
})
export class BusWidgetComponent {
  @ViewChild('paymentFormRef') paymentFormRef?: PaymentFormComponent;

  step: Step = 'search';
  schedules: Schedule[] = [];
  schedulesLoading = false;
  schedulesSearched = false;

  selectedSchedule: Schedule | null = null;
  selectedSeats: Seat[] = [];
  passengersCount = 1;
  pendingBooking: PendingBooking | null = null;
  confirmation: BookingConfirmation | null = null;
  bookingError: string | null = null;
  paymentError: string | null = null;

  readonly steps: { id: Step; label: string }[] = [
    { id: 'search',       label: 'Búsqueda' },
    { id: 'schedules',    label: 'Horarios' },
    { id: 'seats',        label: 'Asientos' },
    { id: 'passengers',   label: 'Pasajeros' },
    { id: 'payment',      label: 'Pago' },
    { id: 'confirmation', label: 'Confirmación' },
  ];

  constructor(private api: BusApiService) {}

  get stepIndex(): number {
    return this.steps.findIndex((s) => s.id === this.step);
  }

  onSearch(params: SearchParams): void {
    this.passengersCount = params.passengers;
    this.schedulesLoading = true;
    this.schedulesSearched = false;
    this.schedules = [];
    this.step = 'schedules';

    this.api.searchSchedules(params).subscribe({
      next: (data) => {
        this.schedules = data;
        this.schedulesLoading = false;
        this.schedulesSearched = true;
      },
      error: () => {
        this.schedulesLoading = false;
        this.schedulesSearched = true;
      },
    });
  }

  onScheduleSelect(schedule: Schedule): void {
    this.selectedSchedule = schedule;
    this.selectedSeats = [];
    this.step = 'seats';
  }

  onSeatsChosen(seats: Seat[]): void {
    this.selectedSeats = seats;
    this.step = 'passengers';
  }

  onConfirm(payload: BookingPayload): void {
    this.bookingError = null;
    this.api.createBooking(payload).subscribe({
      next: (pending) => {
        this.pendingBooking = pending;
        this.step = 'payment';
      },
      error: (err) => {
        this.bookingError =
          err?.error?.message ?? 'Error al procesar la reserva. Intenta nuevamente.';
      },
    });
  }

  onPay(cardPayload: PaymentPayload): void {
    this.paymentError = null;

    try {
      this.api.redirectToPaymentPage(this.pendingBooking!.booking_code, cardPayload);
    } catch {
      this.paymentError = 'No se pudo abrir la pagina de pago.';
      this.paymentFormRef?.stopProcessing();
    }
  }

  onNewSearch(): void {
    this.step = 'search';
    this.schedules = [];
    this.selectedSchedule = null;
    this.selectedSeats = [];
    this.pendingBooking = null;
    this.bookingError = null;
    this.paymentError = null;
    this.schedulesSearched = false;
  }
}
