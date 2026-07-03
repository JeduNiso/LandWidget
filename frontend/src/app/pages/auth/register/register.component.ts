import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { NavbarComponent } from '../../../components/navbar/navbar.component';

function passwordsMatch(g: AbstractControl) {
  const pw = g.get('password')?.value;
  const cf = g.get('password_confirmation')?.value;
  return pw && cf && pw !== cf ? { mismatch: true } : null;
}

// Defined before @Component to avoid temporal dead zone
const REGISTER_STYLES = `
  :host { display: block; }

  .auth-page {
    min-height: calc(100vh - 64px);
    display: flex; align-items: center; justify-content: center;
    padding: 24px 16px;
  }

  .auth-card {
    background: var(--card-bg); border-radius: var(--radius);
    padding: clamp(24px, 5vw, 48px);
    width: 100%; max-width: 480px;
    box-shadow: var(--shadow-card);
  }

  .auth-card__header { text-align: center; margin-bottom: 28px; }
  .auth-title {
    font-size: clamp(1.4rem, 4vw, 1.8rem); font-weight: 800;
    color: var(--text-card); margin: 0 0 6px;
  }
  .auth-sub { color: var(--text-card-sub); font-size: 0.9rem; margin: 0; }

  .auth-form { display: flex; flex-direction: column; gap: 16px; }

  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label {
    font-size: 0.8rem; font-weight: 700; color: var(--text-card-sub);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .req { color: var(--accent); margin-left: 2px; }
  .optional { color: #aaa; font-weight: 400; text-transform: none; }

  .field input[type=text],
  .field input[type=email],
  .field input[type=tel],
  .field input[type=password] {
    height: 48px; padding: 0 14px;
    border: 1.5px solid var(--input-border);
    border-radius: var(--radius-sm); font-size: 1rem;
    background: var(--input-bg); color: var(--text-card);
    font-family: var(--font); width: 100%; box-sizing: border-box;
    transition: border-color var(--transition);
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

  .strength-bar {
    height: 4px; border-radius: 2px;
    background: #eee; overflow: hidden; margin-top: 6px;
  }
  .strength-bar__fill {
    height: 100%; border-radius: 2px;
    transition: width 0.3s ease, background 0.3s ease;
  }
  .strength-bar[data-level=weak] .strength-bar__fill { width: 33%; background: #e63946; }
  .strength-bar[data-level=medium] .strength-bar__fill { width: 66%; background: #f59e0b; }
  .strength-bar[data-level=strong] .strength-bar__fill { width: 100%; background: #10b981; }

  .strength-label { font-size: 0.75rem; font-weight: 700; margin-top: 4px; }
  .strength-label[data-level=weak]   { color: #e63946; }
  .strength-label[data-level=medium] { color: #f59e0b; }
  .strength-label[data-level=strong] { color: #10b981; }

  .checkbox-label {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 0.875rem; color: var(--text-card-sub);
    cursor: pointer; user-select: none;
    min-height: 44px; padding-top: 4px;
  }
  .checkbox-label input[type=checkbox] {
    width: 18px; height: 18px; flex-shrink: 0;
    accent-color: var(--accent); cursor: pointer; margin-top: 2px;
  }
  .link-terms { color: var(--accent); font-weight: 600; }

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
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="auth-page">
      <div class="auth-card">

        <div class="auth-card__header">
          <h1 class="auth-title">Crear cuenta</h1>
          <p class="auth-sub">Empezá a disfrutar viajero.bo gratis</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="auth-form">

          <!-- Name -->
          <div class="field" [class.field--error]="touched('name')">
            <label for="reg-name">Nombre completo <span class="req">*</span></label>
            <input id="reg-name" type="text" formControlName="name"
                   autocomplete="name" placeholder="Juan Pérez"
                   (blur)="form.get('name')?.markAsTouched()">
            @if (touched('name')) {
              <span class="field-error" role="alert">El nombre es obligatorio.</span>
            }
          </div>

          <!-- Email -->
          <div class="field" [class.field--error]="touched('email')">
            <label for="reg-email">Correo electrónico <span class="req">*</span></label>
            <input id="reg-email" type="email" formControlName="email"
                   inputmode="email" autocomplete="email"
                   placeholder="tucorreo@ejemplo.com"
                   (blur)="form.get('email')?.markAsTouched()">
            @if (touched('email')) {
              <span class="field-error" role="alert">{{ emailError() }}</span>
            }
          </div>

          <!-- Phone (optional) -->
          <div class="field">
            <label for="reg-phone">
              Teléfono <span class="optional">(opcional)</span>
            </label>
            <input id="reg-phone" type="tel" formControlName="phone"
                   inputmode="tel" autocomplete="tel"
                   placeholder="+591 7xxxxxxx">
          </div>

          <!-- Password -->
          <div class="field" [class.field--error]="touched('password')">
            <label for="reg-pass">Contraseña <span class="req">*</span></label>
            <div class="input-group">
              <input id="reg-pass"
                     [type]="showPassword() ? 'text' : 'password'"
                     formControlName="password"
                     autocomplete="new-password"
                     placeholder="Mínimo 8 caracteres"
                     (blur)="form.get('password')?.markAsTouched()">
              <button type="button" class="btn-eye" (click)="togglePassword()"
                      [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                {{ showPassword() ? '🙈' : '👁' }}
              </button>
            </div>

            <!-- Strength indicator -->
            @if (form.get('password')?.value) {
              <div class="strength-bar" [attr.data-level]="strength()">
                <div class="strength-bar__fill"></div>
              </div>
              <span class="strength-label" [attr.data-level]="strength()">
                Seguridad: {{ strengthLabel() }}
              </span>
            }

            @if (touched('password')) {
              <span class="field-error" role="alert">{{ passwordError() }}</span>
            }
          </div>

          <!-- Confirm Password -->
          <div class="field" [class.field--error]="touched('password_confirmation')">
            <label for="reg-pass2">Confirmar contraseña <span class="req">*</span></label>
            <input id="reg-pass2"
                   [type]="showPassword() ? 'text' : 'password'"
                   formControlName="password_confirmation"
                   autocomplete="new-password"
                   placeholder="Repetí la contraseña"
                   (blur)="form.get('password_confirmation')?.markAsTouched()">
            @if (form.errors?.['mismatch'] && form.get('password_confirmation')?.touched) {
              <span class="field-error" role="alert">Las contraseñas no coinciden.</span>
            }
          </div>

          <!-- Terms -->
          <div class="field" [class.field--error]="touched('terms')">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="terms"
                     (blur)="form.get('terms')?.markAsTouched()">
              <span>
                Acepto los
                <a href="/terminos" target="_blank" class="link-terms">Términos y condiciones</a>
                y la
                <a href="/privacidad" target="_blank" class="link-terms">Política de privacidad</a>
              </span>
            </label>
            @if (touched('terms')) {
              <span class="field-error" role="alert">Debés aceptar los términos.</span>
            }
          </div>

          @if (serverError()) {
            <div class="server-error" role="alert">{{ serverError() }}</div>
          }

          <button type="submit" class="btn-submit" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span> Creando cuenta...
            } @else {
              Crear cuenta gratis
            }
          </button>

        </form>

        <!-- Social placeholders -->
        <div class="social-divider"><span>o registrate con</span></div>
        <div class="social-row">
          <button class="btn-social" disabled>
            <span>G</span> Google
          </button>
          <button class="btn-social" disabled>
            <span>f</span> Facebook
          </button>
        </div>

        <p class="auth-footer">
          ¿Ya tenés cuenta?
          <a routerLink="/auth/login" class="link-register">Iniciar sesión</a>
        </p>

      </div>
    </main>
  `,
  styles: [REGISTER_STYLES],
})
export class RegisterComponent {
  readonly showPassword = signal(false);
  readonly loading      = signal(false);
  readonly serverError  = signal('');

  form = this.fb.group(
    {
      name:                  ['', [Validators.required, Validators.minLength(2)]],
      email:                 ['', [Validators.required, Validators.email]],
      phone:                 [''],
      password:              ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required],
      terms:                 [false, Validators.requiredTrue],
    },
    { validators: passwordsMatch }
  );

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
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

  passwordError(): string {
    const c = this.form.get('password');
    if (c?.hasError('required')) return 'La contraseña es obligatoria.';
    if (c?.hasError('minlength')) return 'Debe tener al menos 8 caracteres.';
    return '';
  }

  strength = computed<'weak' | 'medium' | 'strong'>(() => {
    const pw = this.form.get('password')?.value ?? '';
    let score = 0;
    if (pw.length >= 8)           score++;
    if (/[A-Z]/.test(pw))         score++;
    if (/[0-9]/.test(pw))         score++;
    if (/[^A-Za-z0-9]/.test(pw))  score++;
    if (score <= 1) return 'weak';
    if (score <= 3) return 'medium';
    return 'strong';
  });

  strengthLabel = computed(() => {
    const map = { weak: 'Débil', medium: 'Media', strong: 'Fuerte' };
    return map[this.strength()];
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.serverError.set('');
    const { name, email, phone, password, password_confirmation } = this.form.getRawValue();

    this.auth.register({
      name: name!,
      email: email!,
      password: password!,
      password_confirmation: password_confirmation!,
      phone: phone ?? undefined,
    }).subscribe({
      next: () => {
        this.toast.success('¡Cuenta creada exitosamente!');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        const errors = err?.error?.errors;
        if (errors) {
          const first = Object.values(errors)[0];
          this.serverError.set(Array.isArray(first) ? first[0] as string : String(first));
        } else {
          this.serverError.set(err?.error?.message ?? 'Error al crear la cuenta. Intentá nuevamente.');
        }
      },
    });
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
}

