import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Schedule } from '../../models/bus.models';

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './schedule-list.component.html',
  styleUrls: ['./schedule-list.component.scss'],
})
export class ScheduleListComponent {
  @Input() schedules: Schedule[] = [];
  @Input() loading = false;
  @Input() searched = false;
  @Output() select = new EventEmitter<Schedule>();

  busTypeLabel(type: string): string {
    const map: Record<string, string> = {
      cama: 'Cama',
      'semi-cama': 'Semi Cama',
      ejecutivo: 'Ejecutivo',
      standard: 'Estándar',
    };
    return map[type] ?? type;
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
}
