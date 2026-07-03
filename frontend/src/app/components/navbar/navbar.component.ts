import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar" [class.scrolled]="scrolled">
      <div class="navbar__inner">

        <!-- Brand -->
        <a class="navbar__brand" routerLink="/" (click)="closeMenu()">
          <span class="brand-icon" aria-hidden="true">✈</span>
          <span class="brand-name">viajero<span class="brand-dot">.bo</span></span>
        </a>

        <!-- Desktop links -->
        <div class="navbar__links" [class.open]="menuOpen()">
          <a class="nav-link" routerLink="/" routerLinkActive="active"
             [routerLinkActiveOptions]="{exact:true}" (click)="closeMenu()">
            Inicio
          </a>
          <a class="nav-link" routerLink="/pasajes-bus" routerLinkActive="active"
             (click)="closeMenu()">
            🚌 Pasajes Bus
          </a>

          @if (auth.isLoggedIn()) {
            <a class="nav-link" routerLink="/mi-cuenta" routerLinkActive="active"
               (click)="closeMenu()">
              Mi cuenta
            </a>
            <button class="nav-btn nav-btn--ghost" (click)="logout()">
              Salir
            </button>
          } @else {
            <a class="nav-btn nav-btn--ghost" routerLink="/auth/login"
               (click)="closeMenu()">
              Ingresar
            </a>
            <a class="nav-btn nav-btn--accent" routerLink="/auth/register"
               (click)="closeMenu()">
              Registrarse
            </a>
          }

          <!-- Theme toggle -->
          <button class="btn-theme" (click)="themeService.toggle()"
                  [attr.aria-label]="themeService.theme() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
            {{ themeService.theme() === 'dark' ? '☀️' : '🌙' }}
          </button>
        </div>

        <!-- Right: theme + hamburger on mobile -->
        <div class="navbar__actions">
          <button class="btn-theme btn-theme--mobile" (click)="themeService.toggle()"
                  [attr.aria-label]="'Cambiar tema'">
            {{ themeService.theme() === 'dark' ? '☀️' : '🌙' }}
          </button>
          <button class="hamburger" [class.open]="menuOpen()"
                  (click)="toggleMenu()" aria-label="Abrir menú"
                  [attr.aria-expanded]="menuOpen()">
            <span></span><span></span><span></span>
          </button>
        </div>

      </div>

      <!-- Mobile overlay backdrop -->
      @if (menuOpen()) {
        <div class="navbar__backdrop" (click)="closeMenu()"></div>
      }
    </nav>
  `,
  styles: [`
    :host { display: block; }

    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--nav-bg);
      border-bottom: 1px solid var(--nav-border);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      transition: box-shadow var(--transition);
    }
    .navbar.scrolled {
      box-shadow: var(--shadow-nav);
    }

    .navbar__inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 16px;
      height: 60px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* Brand */
    .navbar__brand {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      flex-shrink: 0;
      min-height: 44px;
    }
    .brand-icon { font-size: 1.4rem; }
    .brand-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-page);
      letter-spacing: -0.3px;
    }
    .brand-dot { color: var(--accent); }

    /* Links (desktop) */
    .navbar__links {
      display: none;
      flex: 1;
      align-items: center;
      gap: 4px;
      padding-left: 16px;
    }

    .nav-link {
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-muted);
      text-decoration: none;
      transition: color var(--transition), background var(--transition);
      min-height: 44px;
      white-space: nowrap;
    }
    .nav-link:hover, .nav-link.active {
      color: var(--text-page);
      background: rgba(255,255,255,0.08);
    }

    .nav-btn {
      padding: 8px 18px;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      min-height: 36px;
      white-space: nowrap;
      border: none;
      transition: background var(--transition), color var(--transition);
    }
    .nav-btn--ghost {
      background: transparent;
      color: var(--text-muted);
      border: 1.5px solid var(--border);
    }
    .nav-btn--ghost:hover { color: var(--text-page); border-color: var(--text-page); }
    .nav-btn--accent {
      background: var(--accent);
      color: #fff;
    }
    .nav-btn--accent:hover { background: var(--accent-hover); }

    .btn-theme {
      background: none;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 8px;
      border-radius: var(--radius-sm);
      min-height: 44px;
      min-width: 44px;
      transition: background var(--transition);
      color: var(--text-page);
    }
    .btn-theme:hover { background: rgba(255,255,255,0.1); }

    /* Spacer */
    .navbar__actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Hamburger */
    .hamburger {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 44px;
      height: 44px;
      padding: 12px 10px;
      background: none;
      border: none;
      cursor: pointer;
      border-radius: var(--radius-sm);
      transition: background var(--transition);
      min-height: 44px;
    }
    .hamburger:hover { background: rgba(255,255,255,0.08); }
    .hamburger span {
      display: block;
      height: 2px;
      background: var(--text-page);
      border-radius: 2px;
      transition: transform 0.25s ease, opacity 0.25s ease;
      transform-origin: center;
    }
    .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    /* Mobile menu */
    .navbar__backdrop {
      position: fixed;
      inset: 0;
      top: 60px;
      background: rgba(0,0,0,0.5);
      z-index: -1;
    }

    /* Tablet+ */
    @media (min-width: 768px) {
      .hamburger { display: none; }
      .btn-theme--mobile { display: none; }
      .navbar__links {
        display: flex;
      }
      .navbar__inner { height: 64px; }
    }

    /* Mobile overlay menu */
    @media (max-width: 767px) {
      .navbar__links {
        position: fixed;
        top: 60px;
        left: 0;
        right: 0;
        background: var(--nav-bg);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--nav-border);
        flex-direction: column;
        align-items: stretch;
        gap: 0;
        padding: 8px 16px 16px;
        transform: translateY(-100%);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.28s ease, opacity 0.22s ease;
        z-index: 99;
      }
      .navbar__links.open {
        display: flex;
        transform: translateY(0);
        opacity: 1;
        pointer-events: all;
      }
      .nav-link, .nav-btn {
        width: 100%;
        text-align: left;
        padding: 14px 12px;
        border-radius: var(--radius-sm);
        border: none;
        font-size: 1rem;
      }
      .nav-btn--accent {
        text-align: center;
        margin-top: 8px;
        padding: 14px;
      }
      .btn-theme {
        display: none; /* shown via btn-theme--mobile in actions */
      }
    }
  `],
})
export class NavbarComponent {
  readonly menuOpen = signal(false);
  scrolled = false;

  constructor(
    readonly auth: AuthService,
    readonly themeService: ThemeService,
    private toast: ToastService,
  ) {}

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 8;
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.toast.success('Sesión cerrada correctamente.'),
      error: () => {
        // Force local clear even if server fails
        this.auth.clearSession();
        this.toast.info('Sesión cerrada.');
      },
    });
    this.closeMenu();
  }
}
