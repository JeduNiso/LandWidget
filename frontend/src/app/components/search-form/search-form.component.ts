import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusApiService } from '../../services/bus-api.service';
import { City } from '../../models/bus.models';

export interface SearchParams {
  origin_city_id: number;
  destination_city_id: number;
  departure_date: string;
  passengers: number;
}

@Component({
  selector: 'app-search-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.scss'],
})
export class SearchFormComponent implements OnInit {
  @Output() search = new EventEmitter<SearchParams>();

  cities: City[] = [];
  originId: number | null = null;
  destinationId: number | null = null;
  departureDate: string = '';
  passengers: number = 1;
  loading = false;
  minDate: string;

  constructor(private api: BusApiService) {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    this.departureDate = this.minDate;
  }

  ngOnInit(): void {
    this.api.getCities().subscribe((c) => (this.cities = c));
  }

  get destinationCities(): City[] {
    return this.cities.filter((c) => c.id !== this.originId);
  }

  get originCities(): City[] {
    return this.cities.filter((c) => c.id !== this.destinationId);
  }

  onSubmit(): void {
    if (!this.originId || !this.destinationId || !this.departureDate) return;
    this.search.emit({
      origin_city_id: this.originId,
      destination_city_id: this.destinationId,
      departure_date: this.departureDate,
      passengers: this.passengers,
    });
  }
}
