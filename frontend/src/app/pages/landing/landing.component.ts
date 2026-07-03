import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface Service {
  icon: string;
  title: string;
  description: string;
  route: string | null;
  available: boolean;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  template: `
    <div class="page">

      <!-- HEADER -->
      <header class="header">
        <div class="brand">
          <span class="brand-icon">✈</span>
          <span class="brand-name">viajero<span class="brand-dot">.bo</span></span>
        </div>
        <p class="brand-tagline">Tu plataforma de servicios para viajeros en Bolivia</p>
      </header>

      <!-- HERO -->
      <section class="hero">
        <h1 class="hero-title">¿A dónde quieres ir?</h1>
        <p class="hero-sub">Encontrá pasajes, autos, paquetes y más en un solo lugar.</p>
      </section>

      <!-- SERVICES GRID -->
      <section class="services">
        <h2 class="section-label">NUESTROS SERVICIOS</h2>
        <div class="grid">

          <!-- BOLETOS DE BUS — principal -->
          <div class="card card--featured" (click)="go('/pasajes-bus')">
            <div class="card-badge">DISPONIBLE</div>
            <div class="card-icon">🚌</div>
            <h3 class="card-title">Compra de boletos de bus</h3>
            <p class="card-desc">Buscá y comprá pasajes entre las principales ciudades de Bolivia al instante.</p>
            <button class="btn btn--primary" (click)="go('/pasajes-bus'); $event.stopPropagation()">
              Comprar ahora
            </button>
          </div>

          <!-- ALQUILER DE AUTOS -->
          <div class="card card--soon">
            <div class="card-badge card-badge--soon">PRÓXIMAMENTE</div>
            <div class="card-icon">🚗</div>
            <h3 class="card-title">Alquiler de autos</h3>
            <p class="card-desc">Rentá un vehículo en tu ciudad destino con las mejores tarifas garantizadas.</p>
            <button class="btn btn--ghost" disabled>Ver más</button>
          </div>

          <!-- PAQUETES TURÍSTICOS -->
          <div class="card card--soon">
            <div class="card-badge card-badge--soon">PRÓXIMAMENTE</div>
            <div class="card-icon">🏔️</div>
            <h3 class="card-title">Paquetes turísticos</h3>
            <p class="card-desc">Descubrí Bolivia con paquetes todo incluido: transporte, hospedaje y tours.</p>
            <button class="btn btn--ghost" disabled>Ver más</button>
          </div>

          <!-- SEGUROS DE VIAJE -->
          <div class="card card--soon">
            <div class="card-badge card-badge--soon">PRÓXIMAMENTE</div>
            <div class="card-icon">🛡️</div>
            <h3 class="card-title">Seguros de viaje</h3>
            <p class="card-desc">Viajá tranquilo con coberturas personalizadas para cualquier destino.</p>
            <button class="btn btn--ghost" disabled>Ver más</button>
          </div>

        </div>
      </section>

      <!-- FOOTER -->
      <footer class="footer">
        <p>© 2026 viajero.bo — Bolivia</p>
      </footer>

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
      padding: 40px 16px 32px;
      box-sizing: border-box;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    /* HEADER */
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    .brand-icon {
      font-size: 2rem;
    }
    .brand-name {
      font-size: 2rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.5px;
    }
    .brand-dot {
      color: #e57e8a;
    }
    .brand-tagline {
      color: rgba(255,255,255,0.6);
      font-size: 0.9rem;
      margin: 0;
      letter-spacing: 0.02em;
    }

    /* HERO */
    .hero {
      text-align: center;
      margin-bottom: 40px;
    }
    .hero-title {
      font-size: clamp(1.8rem, 5vw, 3rem);
      font-weight: 800;
      color: #fff;
      margin: 0 0 10px;
      letter-spacing: -0.5px;
    }
    .hero-sub {
      color: rgba(255,255,255,0.65);
      font-size: 1.05rem;
      margin: 0;
    }

    /* SECTION LABEL */
    .section-label {
      text-align: center;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: rgba(255,255,255,0.45);
      margin: 0 0 20px;
    }

    /* GRID */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      width: 100%;
      max-width: 960px;
    }

    /* CARD */
    .card {
      background: #fff;
      border-radius: 16px;
      padding: 28px 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      display: flex;
      flex-direction: column;
      gap: 10px;
      position: relative;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    }
    .card--featured {
      cursor: pointer;
      border: 2px solid #e57e8a;
      grid-column: 1 / -1;
      flex-direction: row;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    .card--featured:hover {
      transform: translateY(-3px);
      box-shadow: 0 14px 48px rgba(229,126,138,0.3);
    }
    .card--soon {
      opacity: 0.82;
    }

    /* BADGE */
    .card-badge {
      position: absolute;
      top: 14px;
      right: 14px;
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      background: #e57e8a;
      color: #fff;
      padding: 3px 8px;
      border-radius: 20px;
    }
    .card-badge--soon {
      background: #b0b8c9;
    }

    /* CARD CONTENT */
    .card-icon {
      font-size: 2.4rem;
      line-height: 1;
      flex-shrink: 0;
    }
    .card--featured .card-icon {
      font-size: 3rem;
    }
    .card-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0;
    }
    .card-desc {
      font-size: 0.9rem;
      color: #5a6478;
      margin: 0;
      flex: 1;
      line-height: 1.5;
    }

    /* FEATURED layout */
    .card--featured .card-title { font-size: 1.35rem; }
    .card--featured > *:not(.card-badge):not(.card-icon) {
      flex: 1 1 160px;
    }

    /* BUTTONS */
    .btn {
      display: inline-block;
      padding: 10px 22px;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      cursor: pointer;
      border: none;
      transition: background 0.15s ease, opacity 0.15s ease;
      white-space: nowrap;
      align-self: flex-start;
    }
    .btn--primary {
      background: #e57e8a;
      color: #fff;
    }
    .btn--primary:hover { background: #d9606f; }
    .btn--ghost {
      background: transparent;
      color: #b0b8c9;
      border: 1.5px solid #d0d5de;
    }
    .btn--ghost:disabled { cursor: default; }

    /* FOOTER */
    .footer {
      margin-top: 48px;
      color: rgba(255,255,255,0.3);
      font-size: 0.8rem;
    }

    /* RESPONSIVE */
    @media (max-width: 600px) {
      .card--featured {
        flex-direction: column;
        align-items: flex-start;
      }
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LandingComponent {
  constructor(private router: Router) {}

  go(route: string) {
    this.router.navigate([route]);
  }
}
