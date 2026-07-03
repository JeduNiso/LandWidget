import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BusWidgetComponent } from '../../components/bus-widget/bus-widget.component';

@Component({
  selector: 'app-pasajes-bus',
  standalone: true,
  imports: [BusWidgetComponent],
  template: `
    <div class="page">
      <div class="back-bar">
        <button class="btn-back" (click)="router.navigate(['/'])">
          ← Volver al inicio
        </button>
      </div>
      <app-bus-widget></app-bus-widget>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px 40px;
      box-sizing: border-box;
    }
    .back-bar {
      width: 100%;
      max-width: 720px;
      margin-bottom: 12px;
    }
    .btn-back {
      background: transparent;
      border: none;
      color: rgba(255,255,255,0.65);
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      padding: 6px 0;
      letter-spacing: 0.02em;
      transition: color 0.15s;
    }
    .btn-back:hover { color: #fff; }
    app-bus-widget {
      width: 100%;
      max-width: 720px;
      background: #fff;
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      box-sizing: border-box;
    }
  `]
})
export class PasajesBusComponent {
  constructor(public router: Router) {}
}
