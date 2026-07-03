import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Schedule, Seat, BookingPayload, PassengerPayload } from '../../models/bus.models';

export interface PassengerForm {
  seat: Seat;
  first_name: string;
  last_name: string;
  document_type: string;
  document_number: string;
}

@Component({
  selector: 'app-passenger-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './passenger-form.component.html',
  styleUrls: ['./passenger-form.component.scss'],
})
export class PassengerFormComponent implements OnInit {
  @Input() schedule!: Schedule;
  @Input() seats: Seat[] = [];
  @Output() confirm = new EventEmitter<BookingPayload>();
  @Output() back = new EventEmitter<void>();

  passengers: PassengerForm[] = [];
  contactName = '';
  contactEmail = '';
  contactPhone = '';
  documentTypes = ['CI', 'Pasaporte', 'CIE'];

  ngOnInit(): void {
    this.passengers = this.seats.map((seat) => ({
      seat,
      first_name: '',
      last_name: '',
      document_type: 'DNI',
      document_number: '',
    }));
  }

  get seatNumbers(): string {
    return this.seats.map((s) => s.seat_number).join(', ');
  }

  get totalAmount(): number {
    return this.schedule.price * this.seats.length;
  }

  get isValid(): boolean {
    const contactOk =
      this.contactName.trim().length > 0 &&
      this.contactEmail.trim().length > 0 &&
      this.contactPhone.trim().length > 0;

    const passengersOk = this.passengers.every(
      (p) =>
        p.first_name.trim().length > 0 &&
        p.last_name.trim().length > 0 &&
        p.document_number.trim().length > 0
    );

    return contactOk && passengersOk;
  }

  onSubmit(): void {
    if (!this.isValid) return;

    const payload: BookingPayload = {
      schedule_id: this.schedule.id,
      contact_name: this.contactName.trim(),
      contact_email: this.contactEmail.trim(),
      contact_phone: this.contactPhone.trim(),
      passengers: this.passengers.map(
        (p): PassengerPayload => ({
          seat_id: p.seat.id,
          first_name: p.first_name.trim(),
          last_name: p.last_name.trim(),
          document_type: p.document_type,
          document_number: p.document_number.trim(),
        })
      ),
    };

    this.confirm.emit(payload);
  }
}
