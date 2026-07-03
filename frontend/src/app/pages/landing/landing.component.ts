import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterModule, NavbarComponent],
  template: `
    <div class="page">
      <app-navbar></app-navbar>

      <!-- HERO -->
      <section class="hero">
        <div class="hero__inner">
          <p class="hero-eyebrow">🇧🇴 Bolivia</p>
          <h1 class="hero-title">¿A dónde querés ir?</h1>
          <p class="hero-sub">
            Encontrá pasajes de bus, vuelos y paquetes turísticos en un solo lugar.
          </p>
          <div class="hero-cta">
            <button class="btn btn--primary btn--lg" (click)="go('/pasajes-bus')">
              🚌 Comprar pasaje ahora
            </button>
          </div>
          <div class="hero-trust">
            <span>✓ Pago seguro</span>
            <span>✓ Boleto digital</span>
            <span>✓ Soporte 24/7</span>
          </div>
        </div>
      </section>

      <!-- SERVICES GRID -->
      <section class="services" aria-labelledby="services-heading">
        <div class="services__inner">
          <h2 id="services-heading" class="section-label">NUESTROS SERVICIOS</h2>
          <div class="grid">

            <!-- BOLETOS DE BUS — principal -->
            <article class="card card--featured" (click)="go('/pasajes-bus')"
                     tabindex="0" role="button"
                     (keydown.enter)="go('/pasajes-bus')"
                     aria-label="Ir a compra de boletos de bus">
              <div class="card-badge" aria-label="Disponible">DISPONIBLE</div>
              <div class="card-icon" aria-hidden="true">🚌</div>
              <div class="card-body">
                <h3 class="card-title">Compra de boletos de bus</h3>
                <p class="card-desc">
                  Buscá y comprá pasajes entre las principales ciudades de Bolivia al instante.
                </p>
                <button class="btn btn--primary btn--full-mobile"
                        (click)="go('/pasajes-bus'); $event.stopPropagation()">
                  Comprar ahora
                </button>
              </div>
            </article>

            <!-- BOLETOS DE AVIÓN -->
            <article class="card card--soon" aria-label="Boletos de avión - próximamente">
              <div class="card-badge card-badge--soon">PRÓXIMAMENTE</div>
              <div class="card-icon" aria-hidden="true">✈️</div>
              <div class="card-body">
                <h3 class="card-title">Boletos de avión</h3>
                <p class="card-desc">
                  Encontrá los mejores precios en vuelos nacionales e internacionales.
                </p>
                <button class="btn btn--ghost" disabled aria-disabled="true">Ver más</button>
              </div>
            </article>

            <!-- PAQUETES TURÍSTICOS -->
            <article class="card card--soon" aria-label="Paquetes turísticos - próximamente">
              <div class="card-badge card-badge--soon">PRÓXIMAMENTE</div>
              <div class="card-icon" aria-hidden="true">🏔️</div>
              <div class="card-body">
                <h3 class="card-title">Paquetes turísticos</h3>
                <p class="card-desc">
                  Descubrí Bolivia con paquetes todo incluido: transporte, hospedaje y tours.
                </p>
                <button class="btn btn--ghost" disabled aria-disabled="true">Ver más</button>
              </div>
            </article>

            <!-- SEGUROS DE VIAJE -->
            <article class="card card--soon" aria-label="Seguros de viaje - próximamente">
              <div class="card-badge card-badge--soon">PRÓXIMAMENTE</div>
              <div class="card-icon" aria-hidden="true">🛡️</div>
              <div class="card-body">
                <h3 class="card-title">Seguros de viaje</h3>
                <p class="card-desc">
                  Viajá tranquilo con coberturas personalizadas para cualquier destino.
                </p>
                <button class="btn btn--ghost" disabled aria-disabled="true">Ver más</button>
              </div>
            </article>

          </div>
        </div>
      </section>

      <!-- WHY US -->
      <section class="why-us" aria-labelledby="why-heading">
        <div class="why-us__inner">
          <h2 id="why-heading" class="section-label">¿POR QUÉ ELEGIRNOS?</h2>
          <div class="features">
            <div class="feature">
              <span class="feature-icon" aria-hidden="true">⚡</span>
              <h3>Rápido y fácil</h3>
              <p>Reservá tu pasaje en menos de 2 minutos desde cualquier dispositivo.</p>
            </div>
            <div class="feature">
              <span class="feature-icon" aria-hidden="true">🔒</span>
              <h3>Pago seguro</h3>
              <p>Transacciones protegidas con cifrado SSL de última generación.</p>
            </div>
            <div class="feature">
              <span class="feature-icon" aria-hidden="true">📱</span>
              <h3>Boleto digital</h3>
              <p>Recibí tu boleto en tu email al instante, sin filas ni esperas.</p>
            </div>
            <div class="feature">
              <span class="feature-icon" aria-hidden="true">🎧</span>
              <h3>Soporte 24/7</h3>
              <p>Equipo de atención disponible para ayudarte en cualquier momento.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="footer">
        <div class="footer__inner">
          <div class="footer-brand">
            <span aria-hidden="true">✈</span>
            <span>viajero<span class="brand-dot">.bo</span></span>
          </div>
          <p class="footer-tagline">Tu plataforma de servicios para viajeros en Bolivia</p>
          <nav class="footer-links" aria-label="Links del pie de página">
            <a href="/terminos">Términos</a>
            <a href="/privacidad">Privacidad</a>
            <a href="/contacto">Contacto</a>
          </nav>
          <p class="footer-copy">© 2026 viajero.bo — Bolivia. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ── PAGE LAYOUT ─────────────────────────────────── */
    .page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* ── HERO (mobile-first) ─────────────────────────── */
    .hero {
      text-align: center;
      padding: 48px 16px 40px;
    }
    .hero__inner {
      max-width: 640px;
      margin: 0 auto;
    }
    .hero-eyebrow {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin: 0 0 12px;
      text-transform: uppercase;
    }
    .hero-title {
      font-size: clamp(1.9rem, 7vw, 3.2rem);
      font-weight: 800;
      color: var(--text-page);
      margin: 0 0 12px;
      letter-spacing: -0.5px;
      line-height: 1.15;
    }
    .hero-sub {
      color: var(--text-muted);
      font-size: clamp(0.95rem, 2.5vw, 1.1rem);
      margin: 0 0 28px;
      line-height: 1.6;
    }
    .hero-cta {
      margin-bottom: 24px;
    }
    .hero-trust {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px 20px;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .hero-trust span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* ── SERVICES SECTION ────────────────────────────── */
    .services {
      padding: 0 16px 48px;
    }
    .services__inner {
      max-width: 960px;
      margin: 0 auto;
    }
    .section-label {
      text-align: center;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: var(--text-muted);
      margin: 0 0 20px;
      text-transform: uppercase;
    }

    /* ── GRID ────────────────────────────────────────── */
    .grid {
      display: grid;
      /* Mobile: 1 col */
      grid-template-columns: 1fr;
      gap: 16px;
    }

    /* ── CARD ────────────────────────────────────────── */
    .card {
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 24px 20px;
      box-shadow: var(--shadow-card);
      display: flex;
      flex-direction: column;
      gap: 10px;
      position: relative;
      transition: transform var(--transition), box-shadow var(--transition);
    }
    .card--featured {
      cursor: pointer;
      border: 2px solid var(--accent);
      flex-direction: row;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .card--featured:hover,
    .card--featured:focus-visible {
      transform: translateY(-3px);
      box-shadow: 0 14px 48px rgba(var(--accent-rgb), 0.3);
      outline: none;
    }
    .card--soon { opacity: 0.82; }

    /* Badge */
    .card-badge {
      position: absolute;
      top: 14px; right: 14px;
      font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em;
      background: var(--accent); color: #fff;
      padding: 3px 8px; border-radius: 20px;
    }
    .card-badge--soon { background: #b0b8c9; }

    /* Card body */
    .card-icon {
      font-size: 2.4rem; line-height: 1; flex-shrink: 0;
    }
    .card--featured .card-icon { font-size: 3rem; }
    .card-body { display: flex; flex-direction: column; gap: 8px; flex: 1 1 0; min-width: 0; }
    .card-title {
      font-size: 1.1rem; font-weight: 700;
      color: var(--text-card); margin: 0;
    }
    .card--featured .card-title { font-size: 1.3rem; }
    .card-desc {
      font-size: 0.88rem; color: var(--text-card-sub);
      margin: 0; flex: 1; line-height: 1.55;
    }

    /* ── BUTTONS ─────────────────────────────────────── */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 24px;
      border-radius: var(--radius-sm);
      font-size: 0.9rem; font-weight: 700;
      letter-spacing: 0.03em;
      cursor: pointer; border: none;
      transition: background var(--transition), opacity var(--transition);
      white-space: nowrap;
      min-height: 44px;
      align-self: flex-start;
      text-decoration: none;
    }
    .btn--primary { background: var(--accent); color: #fff; }
    .btn--primary:hover { background: var(--accent-hover); }
    .btn--lg { padding: 14px 32px; font-size: 1rem; }
    .btn--ghost {
      background: transparent;
      color: #b0b8c9;
      border: 1.5px solid #d0d5de;
    }
    .btn--ghost:disabled { cursor: default; opacity: 0.6; }

    /* Full-width on mobile only */
    .btn--full-mobile { width: 100%; align-self: stretch; }

    /* ── WHY US ──────────────────────────────────────── */
    .why-us {
      padding: 8px 16px 48px;
    }
    .why-us__inner {
      max-width: 960px; margin: 0 auto;
    }
    .features {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .feature {
      background: rgba(255,255,255,0.06);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 20px 16px;
      text-align: center;
    }
    .feature-icon { font-size: 2rem; display: block; margin-bottom: 10px; }
    .feature h3 {
      color: var(--text-page); font-size: 0.95rem; margin: 0 0 6px;
    }
    .feature p {
      color: var(--text-muted); font-size: 0.82rem; margin: 0; line-height: 1.5;
    }

    /* ── FOOTER ──────────────────────────────────────── */
    .footer {
      margin-top: auto;
      padding: 32px 16px;
      border-top: 1px solid var(--border);
    }
    .footer__inner {
      max-width: 960px; margin: 0 auto; text-align: center;
    }
    .footer-brand {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 1.1rem; font-weight: 800; color: var(--text-page);
      margin-bottom: 6px;
    }
    .brand-dot { color: var(--accent); }
    .footer-tagline {
      color: var(--text-muted); font-size: 0.82rem; margin: 0 0 14px;
    }
    .footer-links {
      display: flex; justify-content: center; gap: 20px;
      flex-wrap: wrap; margin-bottom: 10px;
    }
    .footer-links a {
      color: var(--text-muted); font-size: 0.82rem; text-decoration: none;
      min-height: 44px; display: inline-flex; align-items: center;
      transition: color var(--transition);
    }
    .footer-links a:hover { color: var(--text-page); }
    .footer-copy {
      color: var(--text-muted); font-size: 0.75rem; margin: 0; opacity: 0.7;
    }

    /* ── BREAKPOINTS ─────────────────────────────────── */

    /* Tablet (768px+) */
    @media (min-width: 768px) {
      .hero { padding: 64px 24px 52px; }
      .services { padding: 0 24px 64px; }
      .grid { grid-template-columns: repeat(3, 1fr); }
      .card--featured {
        grid-column: 1 / -1;
        flex-direction: row;
      }
      .btn--full-mobile { width: auto; align-self: flex-start; }
      .features { grid-template-columns: repeat(4, 1fr); }
    }

    /* Desktop (1024px+) */
    @media (min-width: 1024px) {
      .hero { padding: 80px 32px 64px; }
      .services { padding: 0 32px 80px; }
    }

    /* Extra small (< 360px) */
    @media (max-width: 359px) {
      .hero { padding: 32px 12px 28px; }
      .features { grid-template-columns: 1fr; }
    }
  `]
})
export class LandingComponent {
  constructor(private router: Router) {}

  go(route: string) {
    this.router.navigate([route]);
  }
}
