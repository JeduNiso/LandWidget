import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BusWidgetComponent } from '../../components/bus-widget/bus-widget.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-pasajes-bus',
  standalone: true,
  imports: [BusWidgetComponent, NavbarComponent],
  template: `
    <div class="page">
      <app-navbar></app-navbar>
      <div class="page-content">
        <app-bus-widget></app-bus-widget>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .page-content {
      flex: 1;
      padding: 16px 16px 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    app-bus-widget {
      width: 100%;
      max-width: 720px;
      background: #fff;
      border-radius: 16px;
      padding: 20px 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      box-sizing: border-box;
    }

    @media (min-width: 480px) {
      .page-content { padding: 24px 24px 48px; }
      app-bus-widget { padding: 28px; }
    }

    @media (min-width: 768px) {
      .page-content { padding: 32px 24px 60px; }
    }
  `]
})
export class PasajesBusComponent {
  constructor(public router: Router) {}
}

