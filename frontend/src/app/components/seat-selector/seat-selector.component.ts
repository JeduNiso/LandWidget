import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BusApiService } from '../../services/bus-api.service';
import { Schedule, Seat, SeatsResponse } from '../../models/bus.models';

@Component({
  selector: 'app-seat-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat-selector.component.html',
  styleUrls: ['./seat-selector.component.scss'],
})
export class SeatSelectorComponent implements OnInit {
  @Input() schedule!: Schedule;
  @Input() passengersCount = 1;
  @Output() seatsChosen = new EventEmitter<Seat[]>();
  @Output() back = new EventEmitter<void>();

  seatsData: SeatsResponse | null = null;
  selectedSeats: Seat[] = [];
  loading = true;

  constructor(private api: BusApiService) {}

  ngOnInit(): void {
    this.api.getSeats(this.schedule.id).subscribe((data) => {
      this.seatsData = data;
      this.loading = false;
    });
  }

  get lowerDeckSeats(): Seat[] {
    return this.seatsData?.seats.filter((s) => s.deck === 'lower') ?? [];
  }

  get upperDeckSeats(): Seat[] {
    return this.seatsData?.seats.filter((s) => s.deck === 'upper') ?? [];
  }

  isSelected(seat: Seat): boolean {
    return this.selectedSeats.some((s) => s.id === seat.id);
  }

  toggleSeat(seat: Seat): void {
    if (seat.is_reserved) return;

    if (this.isSelected(seat)) {
      this.selectedSeats = this.selectedSeats.filter((s) => s.id !== seat.id);
    } else {
      if (this.selectedSeats.length < this.passengersCount) {
        this.selectedSeats = [...this.selectedSeats, seat];
      }
    }
  }

  seatClass(seat: Seat): string {
    if (seat.is_reserved) return 'seat seat--reserved';
    if (this.isSelected(seat)) return 'seat seat--selected';
    return 'seat seat--free';
  }

  onContinue(): void {
    this.seatsChosen.emit(this.selectedSeats);
  }

  get selectedSeatNumbers(): string {
    return this.selectedSeats.map((s) => s.seat_number).join(', ');
  }
}
