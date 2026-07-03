import { Component, signal, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { NavbarComponent } from '../../../components/navbar/navbar.component';

type FPStep = 'email' | 'sent' | 'otp' | 'newpass' | 'success';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="auth-page">
      <div class="auth-card">

        <!-- Progress indicator -->
        @if (step() !== 'success') {
          <div class="fp-progress" [attr.aria-label]="'Progreso: paso ' + (stepIndex() + 1) + ' de 4'">
            @for (s of ['email','sent','otp','newpass']; track s; let i = $index) {
              <div class="fp-dot"
                   [class.active]="i === stepIndex()"
                   [class.done]="i < stepIndex()">
              </div>
            }
          </div>
        }

        <!-- STEP 1: Email input -->
        @if (step() === 'email') {
          <div class="auth-card__header">
            <h1 class="auth-title">Recuperar contraseña</h1>
            <p class="auth-sub">Ingresá tu email y te enviaremos un código.</p>
          </div>

          <form [formGroup]="emailForm" (ngSubmit)="sendOtp()" novalidate class="auth-form">
            <div class="field" [class.field--error]="emailTouched()">
              <label for="fp-email">Correo electrónico</label>
              <input id="fp-email" type="email" formControlName="email"
                     inputmode="email" autocomplete="email"
                     placeholder="tucorreo@ejemplo.com"
                     (blur)="markEmail()">
              @if (emailTouched()) {
                <span class="field-error" role="alert">{{ emailError() }}</span>
              }
            </div>

            @if (serverError()) {
              <div class="server-error" role="alert">{{ serverError() }}</div>
            }

            <button type="submit" class="btn-submit" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> Enviando... }
              @else { Enviar código }
            </button>
          </form>

          <p class="auth-footer">
            <a routerLink="/auth/login" class="link-back">← Volver al login</a>
          </p>
        }

        <!-- STEP 2: Sent confirmation -->
        @if (step() === 'sent') {
          <div class="fp-icon-big" aria-hidden="true">📧</div>
          <div class="auth-card__header">
            <h1 class="auth-title">¡Revisá tu correo!</h1>
            <p class="auth-sub">
              Te enviamos un código de 6 dígitos a<br>
              <strong>{{ emailForm.get('email')?.value }}</strong>
            </p>
          </div>
          <p class="fp-hint">
            No olvides revisar la carpeta de spam.
          </p>
          <button class="btn-submit" style="margin-top:8px" (click)="step.set('otp')">
            Ingresar el código
          </button>
          <button class="btn-resend" [disabled]="resendCooldown() > 0" (click)="sendOtp()">
            @if (resendCooldown() > 0) { Reenviar en {{ resendCooldown() }}s }
            @else { Reenviar código }
          </button>
        }

        <!-- STEP 3: OTP input -->
        @if (step() === 'otp') {
          <div class="auth-card__header">
            <h1 class="auth-title">Ingresá el código</h1>
            <p class="auth-sub">
              Código enviado a <strong>{{ emailForm.get('email')?.value }}</strong>
            </p>
          </div>

          <div class="otp-row" role="group" aria-label="Código de 6 dígitos">
            @for (i of otpIndices; track i) {
              <input #otpInput
                     class="otp-box"
                     type="text"
                     inputmode="numeric"
                     maxlength="1"
                     [attr.aria-label]="'Dígito ' + (i + 1)"
                     [value]="otpDigits()[i]"
                     (input)="onOtpInput($event, i)"
                     (keydown)="onOtpKeydown($event, i)"
                     (paste)="onOtpPaste($event)">
            }
          </div>

          @if (otpError()) {
            <div class="server-error" role="alert" style="margin-top:12px">{{ otpError() }}</div>
          }

          <button class="btn-submit" style="margin-top:20px"
                  [disabled]="otpValue().length < 6" (click)="verifyOtp()">
            Verificar código
          </button>
          <button class="btn-resend" (click)="step.set('sent')">
            ← Cambiar correo
          </button>
        }

        <!-- STEP 4: New password -->
        @if (step() === 'newpass') {
          <div class="auth-card__header">
            <h1 class="auth-title">Nueva contraseña</h1>
            <p class="auth-sub">Elegí una contraseña segura.</p>
          </div>

          <form [formGroup]="passForm" (ngSubmit)="resetPassword()" novalidate class="auth-form">

            <div class="field" [class.field--error]="passTouched('password')">
              <label for="fp-pass">Nueva contraseña</label>
              <div class="input-group">
                <input id="fp-pass"
                       [type]="showPassword() ? 'text' : 'password'"
                       formControlName="password"
                       autocomplete="new-password"
                       placeholder="Mínimo 8 caracteres"
                       (blur)="passForm.get('password')?.markAsTouched()">
                <button type="button" class="btn-eye" (click)="togglePassword()"
                        aria-label="Ver contraseña">
                  {{ showPassword() ? '🙈' : '👁' }}
                </button>
              </div>
              @if (passTouched('password')) {
                <span class="field-error" role="alert">Mínimo 8 caracteres.</span>
              }
            </div>

            <div class="field" [class.field--error]="passTouched('password_confirmation')">
              <label for="fp-pass2">Confirmar contraseña</label>
              <input id="fp-pass2"
                     [type]="showPassword() ? 'text' : 'password'"
                     formControlName="password_confirmation"
                     autocomplete="new-password"
                     placeholder="Repetí la contraseña"
                     (blur)="passForm.get('password_confirmation')?.markAsTouched()">
              @if (passForm.errors?.['mismatch'] && passForm.get('password_confirmation')?.touched) {
                <span class="field-error" role="alert">Las contraseñas no coinciden.</span>
              }
            </div>

            @if (serverError()) {
              <div class="server-error" role="alert">{{ serverError() }}</div>
            }

            <button type="submit" class="btn-submit" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> Guardando... }
              @else { Guardar contraseña }
            </button>
          </form>
        }

        <!-- STEP 5: Success -->
        @if (step() === 'success') {
          <div class="fp-success">
            <div class="fp-icon-big" aria-hidden="true">✅</div>
            <h1 class="auth-title">¡Contraseña actualizada!</h1>
            <p class="auth-sub">Ya podés iniciar sesión con tu nueva contraseña.</p>
            <a routerLink="/auth/login" class="btn-submit" style="margin-top:28px;text-decoration:none">
              Ir al login
            </a>
          </div>
        }

      </div>
    </main>
  `,
  styles: [`
    :host { display: block; }

    .auth-page {
      min-height: calc(100vh - 64px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px 16px;
    }
    .auth-card {
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: clamp(24px, 5vw, 48px);
      width: 100%; max-width: 440px;
      box-shadow: var(--shadow-card);
    }
    .auth-card__header { text-align: center; margin-bottom: 28px; }
    .auth-title {
      font-size: clamp(1.4rem, 4vw, 1.8rem); font-weight: 800;
      color: var(--text-card); margin: 0 0 6px;
    }
    .auth-sub { color: var(--text-card-sub); font-size: 0.9rem; margin: 0; }

    /* Progress dots */
    .fp-progress {
      display: flex; justify-content: center; gap: 10px;
      margin-bottom: 28px;
    }
    .fp-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: var(--input-border);
      transition: background var(--transition), transform var(--transition);
    }
    .fp-dot.active { background: var(--accent); transform: scale(1.3); }
    .fp-dot.done   { background: #10b981; }

    .fp-icon-big {
      font-size: 3.5rem; text-align: center; margin-bottom: 16px;
    }
    .fp-hint {
      text-align: center; font-size: 0.875rem;
      color: var(--text-card-sub); margin: 0 0 20px;
    }

    /* Form */
    .auth-form { display: flex; flex-direction: column; gap: 18px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label {
      font-size: 0.8rem; font-weight: 700; color: var(--text-card-sub);
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .field input {
      height: 48px; padding: 0 14px;
      border: 1.5px solid var(--input-border);
      border-radius: var(--radius-sm);
      font-size: 1rem; background: var(--input-bg);
      color: var(--text-card); font-family: var(--font);
      transition: border-color var(--transition);
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

    /* OTP */
    .otp-row {
      display: flex; justify-content: center; gap: 8px;
      margin: 8px 0;
    }
    .otp-box {
      width: 48px; height: 60px;
      border: 2px solid var(--input-border);
      border-radius: var(--radius-sm);
      text-align: center; font-size: 1.6rem; font-weight: 700;
      color: var(--text-card); background: var(--input-bg);
      font-family: var(--font);
      transition: border-color var(--transition);
      caret-color: var(--accent);
      min-height: 44px;
    }
    .otp-box:focus { outline: none; border-color: var(--accent); }

    @media (max-width: 360px) {
      .otp-box { width: 40px; height: 52px; font-size: 1.3rem; }
      .otp-row { gap: 6px; }
    }

    /* Buttons */
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

    .btn-resend {
      margin-top: 12px; background: none; border: none;
      color: var(--accent); font-size: 0.875rem; font-weight: 700;
      cursor: pointer; width: 100%; padding: 10px; min-height: 44px;
      border-radius: var(--radius-sm);
      transition: background var(--transition);
    }
    .btn-resend:hover:not(:disabled) { background: rgba(229,126,138,0.08); }
    .btn-resend:disabled { color: var(--text-card-sub); cursor: not-allowed; }

    .server-error {
      background: #fde8ea; border: 1px solid #fca5ab;
      color: #c0392b; border-radius: var(--radius-sm);
      padding: 12px 14px; font-size: 0.875rem; font-weight: 600;
    }

    .spinner {
      width: 18px; height: 18px;
      border: 2.5px solid rgba(255,255,255,0.4);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.7s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .fp-success {
      text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }

    .auth-footer { text-align: center; margin-top: 20px; }
    .link-back {
      color: var(--text-card-sub); font-size: 0.875rem;
      text-decoration: none; min-height: 44px;
      display: inline-flex; align-items: center;
    }
    .link-back:hover { color: var(--accent); }
  `],
})
export class ForgotPasswordComponent implements AfterViewInit {
  step          = signal<FPStep>('email');
  loading       = signal(false);
  serverError   = signal('');
  otpError      = signal('');
  showPassword  = signal(false);
  resendCooldown = signal(0);
  otpDigits     = signal<string[]>(['', '', '', '', '', '']);

  readonly otpIndices = [0, 1, 2, 3, 4, 5];

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  passForm = this.fb.group(
    {
      password:              ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required],
    },
    {
      validators: (g) => {
        const p = g.get('password')?.value;
        const c = g.get('password_confirmation')?.value;
        return p && c && p !== c ? { mismatch: true } : null;
      },
    }
  );

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
  ) {}

  ngAfterViewInit(): void {}

  stepIndex = (): number => {
    const map: Record<FPStep, number> = { email: 0, sent: 1, otp: 2, newpass: 3, success: 4 };
    return map[this.step()];
  };

  emailTouched(): boolean {
    const c = this.emailForm.get('email');
    return !!(c?.invalid && c?.touched);
  }

  markEmail(): void { this.emailForm.get('email')?.markAsTouched(); }

  emailError(): string {
    const c = this.emailForm.get('email');
    if (c?.hasError('required')) return 'El email es obligatorio.';
    if (c?.hasError('email')) return 'Ingresá un email válido.';
    return '';
  }

  passTouched(field: string): boolean {
    const c = this.passForm.get(field);
    return !!(c?.invalid && c?.touched);
  }

  otpValue(): string { return this.otpDigits().join(''); }

  sendOtp(): void {
    if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.serverError.set('');
    this.auth.forgotPassword(this.emailForm.get('email')!.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set('sent');
        this.startResendCooldown();
      },
      error: (err) => {
        this.loading.set(false);
        this.serverError.set(err?.error?.message ?? 'No se pudo enviar el código. Intentá nuevamente.');
      },
    });
  }

  verifyOtp(): void {
    // OTP verified locally — we just proceed to new password step.
    // The real validation happens in resetPassword() on the server.
    if (this.otpValue().length < 6) return;
    this.step.set('newpass');
  }

  resetPassword(): void {
    if (this.passForm.invalid) { this.passForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.serverError.set('');

    const { password, password_confirmation } = this.passForm.getRawValue();
    this.auth.resetPassword({
      email:                 this.emailForm.get('email')!.value,
      otp:                   this.otpValue(),
      password:              password!,
      password_confirmation: password_confirmation!,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set('success');
      },
      error: (err) => {
        this.loading.set(false);
        this.serverError.set(
          err?.error?.message ?? 'El código es inválido o expiró. Solicitá uno nuevo.'
        );
      },
    });
  }

  // OTP input handlers
  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    const digits = [...this.otpDigits()];
    digits[index] = val;
    this.otpDigits.set(digits);
    if (val && index < 5) {
      const nextEl = this.otpInputs.toArray()[index + 1]?.nativeElement;
      nextEl?.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits()[index] && index > 0) {
      const prevEl = this.otpInputs.toArray()[index - 1]?.nativeElement;
      prevEl?.focus();
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';
    const digits = text.replace(/\D/g, '').slice(0, 6).split('');
    const filled = [...Array(6)].map((_, i) => digits[i] ?? '');
    this.otpDigits.set(filled);
    const lastFilledIdx = filled.reduce((acc, d, i) => d !== '' ? i : acc, -1);
    const focusIdx = Math.min(lastFilledIdx + 1, 5);
    setTimeout(() => {
      this.otpInputs.toArray()[focusIdx]?.nativeElement.focus();
    });
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(60);
    const interval = setInterval(() => {
      this.resendCooldown.update(v => {
        if (v <= 1) { clearInterval(interval); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
}
