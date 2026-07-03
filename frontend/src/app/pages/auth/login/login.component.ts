import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { NavbarComponent } from '../../../components/navbar/navbar.component';

// Styles defined before @Component to avoid temporal dead zone
const AUTH_STYLES = `
  :host { display: block; }

  .auth-page {
    min-height: calc(100vh - 64px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
  }

  .auth-card {
    background: var(--card-bg);
    border-radius: var(--radius);
    padding: clamp(24px, 5vw, 48px);
    width: 100%;
    max-width: 440px;
    box-shadow: var(--shadow-card);
  }

  .auth-card__header { text-align: center; margin-bottom: 28px; }
  .auth-title {
    font-size: clamp(1.4rem, 4vw, 1.8rem); font-weight: 800;
    color: var(--text-card); margin: 0 0 6px;
  }
  .auth-sub { color: var(--text-card-sub); font-size: 0.9rem; margin: 0; }

  .auth-form { display: flex; flex-direction: column; gap: 18px; }

  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label {
    font-size: 0.8rem; font-weight: 700; color: var(--text-card-sub);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .field input {
    height: 48px; padding: 0 14px;
    border: 1.5px solid var(--input-border);
    border-radius: var(--radius-sm); font-size: 1rem;
    background: var(--input-bg); color: var(--text-card);
    font-family: var(--font); transition: border-color var(--transition);
    width: 100%; box-sizing: border-box;
  }
  .field input:focus { outline: none; border-color: var(--accent); }
  .field--error input { border-color: #e63946; }
  .field-error { font-size: 0.78rem; color: #e63946; font-weight: 600; }

  .input-group { position: relative; display: flex; }
  .input-group input { padding-right: 48px; flex: 1; }
  .btn-eye {
    position: absolute; right: 0; top: 0;
    height: 48px; width: 48px;
    background: none; border: none; cursor: pointer;
    font-size: 1rem; min-height: 44px; color: var(--text-card-sub);
  }

  .auth-row {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 8px;
  }
  .checkbox-label {
    display: flex; align-items: center; gap: 8px;
    font-size: 0.875rem; color: var(--text-card-sub);
    cursor: pointer; min-height: 44px; user-select: none;
  }
  .checkbox-label input[type=checkbox] {
    width: 18px; height: 18px; accent-color: var(--accent); cursor: pointer;
  }
  .link-forgot {
    font-size: 0.875rem; color: var(--accent); text-decoration: none;
    font-weight: 600; min-height: 44px;
    display: inline-flex; align-items: center;
  }
  .link-forgot:hover { text-decoration: underline; }

  .server-error {
    background: #fde8ea; border: 1px solid #fca5ab;
    color: #c0392b; border-radius: var(--radius-sm);
    padding: 12px 14px; font-size: 0.875rem; font-weight: 600;
  }

  .btn-submit {
    height: 52px; background: var(--accent); color: #fff;
    border: none; border-radius: var(--radius-sm);
    font-size: 1rem; font-weight: 700; cursor: pointer;
    width: 100%; transition: background var(--transition);
    display: flex; align-items: center; justify-content: center;
    gap: 8px; min-height: 44px;
  }
  .btn-submit:hover:not(:disabled) { background: var(--accent-hover); }
  .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

  .spinner {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(255,255,255,0.4);
    border-top-color: #fff; border-radius: 50%;
    animation: spin 0.7s linear infinite; flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .social-divider {
    text-align: center; margin: 20px 0 16px;
    position: relative; color: var(--text-card-sub); font-size: 0.8rem;
  }
  .social-divider::before, .social-divider::after {
    content: ''; position: absolute; top: 50%;
    width: 38%; height: 1px; background: var(--input-border);
  }
  .social-divider::before { left: 0; }
  .social-divider::after  { right: 0; }

  .social-row { display: flex; gap: 12px; margin-bottom: 4px; }
  .btn-social {
    flex: 1; height: 48px;
    border: 1.5px solid var(--input-border); border-radius: var(--radius-sm);
    background: transparent; color: var(--text-card-sub);
    font-size: 0.875rem; font-weight: 600;
    cursor: not-allowed; opacity: 0.5; gap: 8px; min-height: 44px;
  }

  .auth-footer {
    text-align: center; margin-top: 20px;
    font-size: 0.875rem; color: var(--text-card-sub);
  }
  .link-register {
    color: var(--accent); font-weight: 700; text-decoration: none;
    min-height: 44px; display: inline-flex; align-items: center; margin-left: 4px;
  }
  .link-register:hover { text-decoration: underline; }
`;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="auth-page">
      <div class="auth-card">

        <!-- Header -->
        <div class="auth-card__header">
          <h1 class="auth-title">Bienvenido de vuelta</h1>
          <p class="auth-sub">Ingresá a tu cuenta de viajero.bo</p>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="auth-form">

          <!-- Email -->
          <div class="field" [class.field--error]="touched('email')">
            <label for="login-email">Correo electrónico</label>
            <input id="login-email" type="email" formControlName="email"
                   inputmode="email" autocomplete="email"
                   placeholder="tucorreo@ejemplo.com"
                   (blur)="form.get('email')?.markAsTouched()">
            @if (touched('email')) {
              <span class="field-error" role="alert">
                {{ emailError() }}
              </span>
            }
          </div>

          <!-- Password -->
          <div class="field" [class.field--error]="touched('password')">
            <label for="login-pass">Contraseña</label>
            <div class="input-group">
              <input id="login-pass"
                     [type]="showPassword() ? 'text' : 'password'"
                     formControlName="password"
                     autocomplete="current-password"
                     placeholder="••••••••"
                     (blur)="form.get('password')?.markAsTouched()">
              <button type="button" class="btn-eye" (click)="togglePassword()"
                      [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                {{ showPassword() ? '🙈' : '👁' }}
              </button>
            </div>
            @if (touched('password')) {
              <span class="field-error" role="alert">Ingresá tu contraseña.</span>
            }
          </div>

          <!-- Remember + Forgot -->
          <div class="auth-row">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="remember">
              <span>Recordarme</span>
            </label>
            <a routerLink="/auth/forgot-password" class="link-forgot">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <!-- Server error -->
          @if (serverError()) {
            <div class="server-error" role="alert">{{ serverError() }}</div>
          }

          <!-- Submit -->
          <button type="submit" class="btn-submit" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span> Ingresando...
            } @else {
              Ingresar
            }
          </button>

        </form>

        <!-- Social placeholders -->
        <div class="social-divider">
          <span>o continuá con</span>
        </div>
        <div class="social-row">
          <button class="btn-social" disabled aria-label="Continuar con Google">
            <span aria-hidden="true">G</span> Google
          </button>
          <button class="btn-social" disabled aria-label="Continuar con Facebook">
            <span aria-hidden="true">f</span> Facebook
          </button>
        </div>

        <!-- Register link -->
        <p class="auth-footer">
          ¿No tenés cuenta?
          <a routerLink="/auth/register" class="link-register">Registrarse gratis</a>
        </p>

      </div>
    </main>
  `,
  styles: [AUTH_STYLES],
})
export class LoginComponent {
  readonly showPassword = signal(false);
  readonly loading      = signal(false);
  readonly serverError  = signal('');

  form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [false],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService,
  ) {}

  touched(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  emailError(): string {
    const c = this.form.get('email');
    if (c?.hasError('required')) return 'El email es obligatorio.';
    if (c?.hasError('email')) return 'Ingresá un email válido.';
    return '';
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.serverError.set('');
    const { email, password, remember } = this.form.getRawValue();

    this.auth.login(email, password, remember).subscribe({
      next: () => {
        this.toast.success('¡Bienvenido de vuelta!');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        this.serverError.set(
          err?.error?.message ?? 'Credenciales incorrectas. Verificá tu email y contraseña.'
        );
      },
    });
  }
}

const _UNUSED_PLACEHOLDER = `
  :host { display: block; }

  .auth-page {
    min-height: calc(100vh - 64px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
  }

  .auth-card {
    background: var(--card-bg);
    border-radius: var(--radius);
    padding: clamp(24px, 5vw, 48px);
    width: 100%;
    max-width: 440px;
    box-shadow: var(--shadow-card);
  }

  .auth-card__header {
    text-align: center;
    margin-bottom: 28px;
  }
  .auth-title {
    font-size: clamp(1.4rem, 4vw, 1.8rem);
    font-weight: 800;
    color: var(--text-card);
    margin: 0 0 6px;
  }
  .auth-sub {
    color: var(--text-card-sub);
    font-size: 0.9rem;
    margin: 0;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .field label {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-card-sub);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .field input {
    height: 48px;
    padding: 0 14px;
    border: 1.5px solid var(--input-border);
    border-radius: var(--radius-sm);
    font-size: 1rem;
    background: var(--input-bg);
    color: var(--text-card);
    font-family: var(--font);
    transition: border-color var(--transition);
    width: 100%;
    box-sizing: border-box;
  }
  .field input:focus {
    outline: none;
    border-color: var(--accent);
  }
  .field--error input { border-color: #e63946; }
  .field-error {
    font-size: 0.78rem;
    color: #e63946;
    font-weight: 600;
  }

  .input-group {
    position: relative;
    display: flex;
  }
  .input-group input { padding-right: 48px; flex: 1; }
  .btn-eye {
    position: absolute;
    right: 0;
    top: 0;
    height: 48px;
    width: 48px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    min-height: 44px;
    color: var(--text-card-sub);
  }

  .auth-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    color: var(--text-card-sub);
    cursor: pointer;
    min-height: 44px;
    user-select: none;
  }
  .checkbox-label input[type=checkbox] {
    width: 18px;
    height: 18px;
    accent-color: var(--accent);
    cursor: pointer;
  }
  .link-forgot {
    font-size: 0.875rem;
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }
  .link-forgot:hover { text-decoration: underline; }

  .server-error {
    background: #fde8ea;
    border: 1px solid #fca5ab;
    color: #c0392b;
    border-radius: var(--radius-sm);
    padding: 12px 14px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .btn-submit {
    height: 52px;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    width: 100%;
    transition: background var(--transition);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
  }
  .btn-submit:hover:not(:disabled) { background: var(--accent-hover); }
  .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

  .spinner {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .social-divider {
    text-align: center;
    margin: 20px 0 16px;
    position: relative;
    color: var(--text-card-sub);
    font-size: 0.8rem;
  }
  .social-divider::before, .social-divider::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 38%;
    height: 1px;
    background: var(--input-border);
  }
  .social-divider::before { left: 0; }
  .social-divider::after  { right: 0; }

  .social-row {
    display: flex;
    gap: 12px;
    margin-bottom: 4px;
  }
  .btn-social {
    flex: 1;
    height: 48px;
    border: 1.5px solid var(--input-border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-card-sub);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: not-allowed;
    opacity: 0.5;
    gap: 8px;
    min-height: 44px;
  }

  .auth-footer {
    text-align: center;
    margin-top: 20px;
    font-size: 0.875rem;
    color: var(--text-card-sub);
  }
  .link-register {
    color: var(--accent);
    font-weight: 700;
    text-decoration: none;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    margin-left: 4px;
  }
  .link-register:hover { text-decoration: underline; }
`;
