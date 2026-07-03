import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { UserBooking, PaginatedResponse } from '../../models/auth.models';

type AccountTab = 'profile' | 'password' | 'bookings' | 'history';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent, SkeletonComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="account-page">
      <div class="account-wrap">

        <!-- Sidebar / Tab nav -->
        <aside class="account-sidebar">
          <!-- Avatar -->
          <div class="profile-avatar">
            <img [src]="avatarUrl()" [alt]="auth.currentUser?.name" class="avatar-img"
                 (error)="onAvatarError($event)">
            <div class="avatar-info">
              <strong>{{ auth.currentUser?.name }}</strong>
              <span>{{ auth.currentUser?.email }}</span>
            </div>
          </div>

          <!-- Nav tabs -->
          <nav class="sidebar-nav" role="tablist">
            @for (tab of tabs; track tab.id) {
              <button class="sidebar-tab" role="tab"
                      [class.active]="activeTab() === tab.id"
                      [attr.aria-selected]="activeTab() === tab.id"
                      (click)="setTab(tab.id)">
                <span class="tab-icon" aria-hidden="true">{{ tab.icon }}</span>
                <span>{{ tab.label }}</span>
              </button>
            }
          </nav>
        </aside>

        <!-- Content area -->
        <section class="account-content" role="tabpanel">

          <!-- ── MIS DATOS ──────────────────────────────────────────── -->
          @if (activeTab() === 'profile') {
            <div class="section-header">
              <h2 class="section-title">Mis datos</h2>
            </div>

            <!-- Avatar upload -->
            <div class="avatar-upload">
              <div class="avatar-preview-wrap">
                <img [src]="avatarUrl()" class="avatar-preview"
                     [alt]="auth.currentUser?.name" (error)="onAvatarError($event)">
                @if (photoPreview()) {
                  <span class="avatar-badge">Vista previa</span>
                }
              </div>
              <label class="btn-upload" for="photo-input">
                📷 Cambiar foto
                <input id="photo-input" type="file" accept="image/*"
                       class="sr-only" (change)="onPhotoChange($event)">
              </label>
              @if (photoFile()) {
                <button class="btn-remove-photo" (click)="clearPhoto()">Quitar</button>
              }
            </div>

            <!-- Profile form -->
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" novalidate class="account-form">

              <div class="field-row">
                <div class="field" [class.field--error]="pTouched('name')">
                  <label for="acc-name">Nombre completo</label>
                  <input id="acc-name" type="text" formControlName="name"
                         autocomplete="name" placeholder="Tu nombre"
                         (blur)="profileForm.get('name')?.markAsTouched()">
                  @if (pTouched('name')) {
                    <span class="field-error" role="alert">El nombre es obligatorio.</span>
                  }
                </div>

                <div class="field">
                  <label for="acc-phone">Teléfono</label>
                  <input id="acc-phone" type="tel" formControlName="phone"
                         inputmode="tel" autocomplete="tel"
                         placeholder="+591 7xxxxxxx">
                </div>
              </div>

              <div class="field" [class.field--error]="pTouched('email')">
                <label for="acc-email">Correo electrónico</label>
                <input id="acc-email" type="email" formControlName="email"
                       inputmode="email" autocomplete="email"
                       placeholder="correo@ejemplo.com"
                       (blur)="profileForm.get('email')?.markAsTouched()">
                @if (pTouched('email')) {
                  <span class="field-error" role="alert">Email inválido.</span>
                }
              </div>

              <button type="submit" class="btn-save" [disabled]="profileLoading()">
                @if (profileLoading()) { <span class="spinner"></span> Guardando... }
                @else { Guardar cambios }
              </button>
            </form>
          }

          <!-- ── CAMBIAR CONTRASEÑA ──────────────────────────────────── -->
          @if (activeTab() === 'password') {
            <div class="section-header">
              <h2 class="section-title">Cambiar contraseña</h2>
            </div>

            <form [formGroup]="passForm" (ngSubmit)="changePassword()" novalidate class="account-form">

              <div class="field" [class.field--error]="pwTouched('current_password')">
                <label for="pw-current">Contraseña actual</label>
                <input id="pw-current" type="password" formControlName="current_password"
                       autocomplete="current-password" placeholder="••••••••"
                       (blur)="passForm.get('current_password')?.markAsTouched()">
                @if (pwTouched('current_password')) {
                  <span class="field-error" role="alert">Ingresá tu contraseña actual.</span>
                }
              </div>

              <div class="field" [class.field--error]="pwTouched('password')">
                <label for="pw-new">Nueva contraseña</label>
                <input id="pw-new" type="password" formControlName="password"
                       autocomplete="new-password" placeholder="Mínimo 8 caracteres"
                       (blur)="passForm.get('password')?.markAsTouched()">
                @if (pwTouched('password')) {
                  <span class="field-error" role="alert">Mínimo 8 caracteres.</span>
                }
              </div>

              <div class="field" [class.field--error]="pwTouched('password_confirmation')">
                <label for="pw-conf">Confirmar contraseña</label>
                <input id="pw-conf" type="password" formControlName="password_confirmation"
                       autocomplete="new-password" placeholder="Repetí la contraseña"
                       (blur)="passForm.get('password_confirmation')?.markAsTouched()">
                @if (passForm.errors?.['mismatch'] && passForm.get('password_confirmation')?.touched) {
                  <span class="field-error" role="alert">Las contraseñas no coinciden.</span>
                }
              </div>

              @if (passError()) {
                <div class="server-error" role="alert">{{ passError() }}</div>
              }

              <button type="submit" class="btn-save" [disabled]="passLoading()">
                @if (passLoading()) { <span class="spinner"></span> Actualizando... }
                @else { Actualizar contraseña }
              </button>
            </form>
          }

          <!-- ── MIS RESERVAS (activas) ─────────────────────────────── -->
          @if (activeTab() === 'bookings') {
            <div class="section-header">
              <h2 class="section-title">Mis reservas</h2>
              <p class="section-sub">Tus compras activas y pendientes.</p>
            </div>

            @if (bookingsLoading()) {
              <div class="skeleton-list">
                @for (i of [1,2,3]; track i) {
                  <app-skeleton height="80px" radius="12px" mb="12px"></app-skeleton>
                }
              </div>
            } @else if (activeBookings().length === 0) {
              <div class="empty-state">
                <div class="empty-icon" aria-hidden="true">🎫</div>
                <h3>Sin reservas activas</h3>
                <p>Cuando realices una compra, aparecerá aquí.</p>
                <a routerLink="/pasajes-bus" class="btn-save" style="text-decoration:none;display:inline-flex;width:auto">
                  Buscar pasajes
                </a>
              </div>
            } @else {
              <div class="booking-list">
                @for (b of activeBookings(); track b.id) {
                  <div class="booking-card" [attr.data-status]="b.status">
                    <div class="booking-card__top">
                      <div class="booking-route">
                        <span class="route-city">{{ b.origin }}</span>
                        <span class="route-arrow" aria-hidden="true">→</span>
                        <span class="route-city">{{ b.destination }}</span>
                      </div>
                      <span class="booking-badge" [attr.data-status]="b.status">
                        {{ statusLabel(b.status) }}
                      </span>
                    </div>
                    <div class="booking-meta">
                      <span>🚌 {{ b.bus_name }}</span>
                      <span>📅 {{ b.departure_at | date:'dd/MM/yyyy HH:mm' }}</span>
                      <span>💺 {{ b.seats }}</span>
                      <span>💰 Bs {{ b.total_amount | number:'1.2-2' }}</span>
                    </div>
                    <div class="booking-code">Código: <strong>{{ b.booking_code }}</strong></div>
                  </div>
                }
              </div>
            }
          }

          <!-- ── HISTORIAL ──────────────────────────────────────────── -->
          @if (activeTab() === 'history') {
            <div class="section-header">
              <h2 class="section-title">Historial de viajes</h2>
              <p class="section-sub">Tus compras pasadas.</p>
            </div>

            @if (historyLoading()) {
              <div class="skeleton-list">
                @for (i of [1,2,3,4]; track i) {
                  <app-skeleton height="80px" radius="12px" mb="12px"></app-skeleton>
                }
              </div>
            } @else if (pastBookings().length === 0) {
              <div class="empty-state">
                <div class="empty-icon" aria-hidden="true">🗺️</div>
                <h3>Sin viajes pasados</h3>
                <p>Tu historial de viajes aparecerá aquí.</p>
              </div>
            } @else {
              <div class="booking-list">
                @for (b of pastBookings(); track b.id) {
                  <div class="booking-card" [attr.data-status]="b.status">
                    <div class="booking-card__top">
                      <div class="booking-route">
                        <span class="route-city">{{ b.origin }}</span>
                        <span class="route-arrow" aria-hidden="true">→</span>
                        <span class="route-city">{{ b.destination }}</span>
                      </div>
                      <span class="booking-badge" [attr.data-status]="b.status">
                        {{ statusLabel(b.status) }}
                      </span>
                    </div>
                    <div class="booking-meta">
                      <span>🚌 {{ b.bus_name }}</span>
                      <span>📅 {{ b.departure_at | date:'dd/MM/yyyy HH:mm' }}</span>
                      <span>💰 Bs {{ b.total_amount | number:'1.2-2' }}</span>
                    </div>
                    <div class="booking-code">Código: <strong>{{ b.booking_code }}</strong></div>
                  </div>
                }
              </div>

              <!-- Pagination -->
              @if (pagination()) {
                <div class="pagination" role="navigation" aria-label="Paginación">
                  <button class="btn-page" [disabled]="pagination()!.current_page <= 1"
                          (click)="loadHistory(pagination()!.current_page - 1)">
                    ← Anterior
                  </button>
                  <span class="page-info">
                    Página {{ pagination()!.current_page }} de {{ pagination()!.last_page }}
                  </span>
                  <button class="btn-page" [disabled]="pagination()!.current_page >= pagination()!.last_page"
                          (click)="loadHistory(pagination()!.current_page + 1)">
                    Siguiente →
                  </button>
                </div>
              }
            }
          }

        </section>
      </div>
    </main>
  `,
  styles: [`
    :host { display: block; }
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0,0,0,0); border: 0;
    }

    .account-page {
      min-height: calc(100vh - 64px);
      padding: 24px 16px 48px;
    }

    .account-wrap {
      max-width: 1000px; margin: 0 auto;
      display: grid; gap: 24px;
      grid-template-columns: 1fr;
    }

    /* ── SIDEBAR ── */
    .account-sidebar {
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow-card);
    }

    .profile-avatar {
      display: flex; align-items: center; gap: 14px;
      padding-bottom: 20px; margin-bottom: 16px;
      border-bottom: 1px solid var(--input-border);
    }
    .avatar-img {
      width: 56px; height: 56px;
      border-radius: 50%; object-fit: cover;
      border: 2px solid var(--accent); flex-shrink: 0;
    }
    .avatar-info {
      display: flex; flex-direction: column; gap: 2px;
      min-width: 0;
    }
    .avatar-info strong {
      color: var(--text-card); font-size: 0.95rem;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .avatar-info span {
      color: var(--text-card-sub); font-size: 0.8rem;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .sidebar-nav {
      display: flex; flex-direction: row; gap: 4px; flex-wrap: wrap;
    }

    .sidebar-tab {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; background: none;
      border: none; border-radius: var(--radius-sm);
      color: var(--text-card-sub); font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: background var(--transition), color var(--transition);
      white-space: nowrap; min-height: 44px; text-align: left;
    }
    .sidebar-tab:hover { background: rgba(229,126,138,0.08); color: var(--accent); }
    .sidebar-tab.active { background: var(--accent); color: #fff; }
    .tab-icon { font-size: 1rem; }

    /* ── CONTENT ── */
    .account-content {
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 28px 24px;
      box-shadow: var(--shadow-card);
      min-height: 400px;
    }

    .section-header { margin-bottom: 24px; }
    .section-title {
      font-size: 1.25rem; font-weight: 800;
      color: var(--text-card); margin: 0 0 4px;
    }
    .section-sub { color: var(--text-card-sub); font-size: 0.875rem; margin: 0; }

    /* ── AVATAR UPLOAD ── */
    .avatar-upload {
      display: flex; align-items: center; gap: 16px;
      margin-bottom: 24px; flex-wrap: wrap;
    }
    .avatar-preview-wrap { position: relative; }
    .avatar-preview {
      width: 80px; height: 80px; border-radius: 50%;
      object-fit: cover; border: 3px solid var(--accent);
      display: block;
    }
    .avatar-badge {
      position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
      background: var(--accent); color: #fff;
      font-size: 0.6rem; font-weight: 700;
      padding: 2px 6px; border-radius: 10px; white-space: nowrap;
    }
    .btn-upload {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 18px; background: var(--accent); color: #fff;
      border-radius: var(--radius-sm); font-size: 0.875rem; font-weight: 700;
      cursor: pointer; min-height: 44px;
      transition: background var(--transition);
    }
    .btn-upload:hover { background: var(--accent-hover); }
    .btn-remove-photo {
      background: none; border: 1.5px solid #e63946; color: #e63946;
      padding: 10px 14px; border-radius: var(--radius-sm);
      font-size: 0.875rem; font-weight: 700; cursor: pointer; min-height: 44px;
    }

    /* ── FORMS ── */
    .account-form { display: flex; flex-direction: column; gap: 18px; max-width: 560px; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

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
      font-family: var(--font); width: 100%; box-sizing: border-box;
      transition: border-color var(--transition);
    }
    .field input:focus { outline: none; border-color: var(--accent); }
    .field--error input { border-color: #e63946; }
    .field-error { font-size: 0.78rem; color: #e63946; font-weight: 600; }

    .btn-save {
      height: 48px; background: var(--accent); color: #fff;
      border: none; border-radius: var(--radius-sm);
      font-size: 0.95rem; font-weight: 700; cursor: pointer;
      width: 100%; transition: background var(--transition);
      display: flex; align-items: center; justify-content: center;
      gap: 8px; min-height: 44px;
    }
    .btn-save:hover:not(:disabled) { background: var(--accent-hover); }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

    .server-error {
      background: #fde8ea; border: 1px solid #fca5ab;
      color: #c0392b; border-radius: var(--radius-sm);
      padding: 12px 14px; font-size: 0.875rem; font-weight: 600;
    }

    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── BOOKINGS ── */
    .booking-list { display: flex; flex-direction: column; gap: 12px; }
    .skeleton-list { display: flex; flex-direction: column; }

    .booking-card {
      border: 1.5px solid var(--input-border);
      border-radius: var(--radius-sm);
      padding: 16px; background: var(--input-bg);
      transition: box-shadow var(--transition);
    }
    .booking-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }

    .booking-card__top {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; margin-bottom: 10px; flex-wrap: wrap;
    }
    .booking-route {
      display: flex; align-items: center; gap: 8px;
      font-weight: 700; color: var(--text-card);
    }
    .route-city { font-size: 1rem; }
    .route-arrow { color: var(--accent); font-size: 0.9rem; }

    .booking-badge {
      font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em;
      padding: 4px 10px; border-radius: 20px; white-space: nowrap;
    }
    .booking-badge[data-status=confirmed] { background: #d1fae5; color: #065f46; }
    .booking-badge[data-status=pending]   { background: #fef3c7; color: #92400e; }
    .booking-badge[data-status=cancelled] { background: #fee2e2; color: #991b1b; }

    .booking-meta {
      display: flex; flex-wrap: wrap; gap: 12px;
      font-size: 0.82rem; color: var(--text-card-sub);
    }
    .booking-code {
      margin-top: 8px; font-size: 0.8rem;
      color: var(--text-card-sub); border-top: 1px solid var(--input-border);
      padding-top: 8px;
    }

    /* ── EMPTY STATE ── */
    .empty-state {
      text-align: center; padding: 48px 24px;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .empty-icon { font-size: 3.5rem; margin-bottom: 8px; }
    .empty-state h3 { color: var(--text-card); margin: 0; font-size: 1.2rem; }
    .empty-state p  { color: var(--text-card-sub); margin: 0 0 16px; font-size: 0.9rem; }

    /* ── PAGINATION ── */
    .pagination {
      display: flex; align-items: center; justify-content: center;
      gap: 16px; margin-top: 20px; flex-wrap: wrap;
    }
    .btn-page {
      padding: 10px 18px; background: none;
      border: 1.5px solid var(--input-border);
      border-radius: var(--radius-sm);
      color: var(--text-card); font-size: 0.875rem; font-weight: 600;
      cursor: pointer; min-height: 44px; transition: all var(--transition);
    }
    .btn-page:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .btn-page:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-info { color: var(--text-card-sub); font-size: 0.875rem; }

    /* ── RESPONSIVE ── */
    @media (min-width: 768px) {
      .account-wrap {
        grid-template-columns: 240px 1fr;
        align-items: start;
      }
      .sidebar-nav {
        flex-direction: column;
      }
      .sidebar-tab { width: 100%; }
    }

    @media (max-width: 560px) {
      .field-row { grid-template-columns: 1fr; }
      .account-content { padding: 20px 16px; }
      .account-sidebar { padding: 20px 16px; }
    }
  `],
})
export class AccountComponent implements OnInit {
  readonly activeTab = signal<AccountTab>('profile');
  readonly profileLoading = signal(false);
  readonly passLoading    = signal(false);
  readonly passError      = signal('');
  readonly bookingsLoading = signal(false);
  readonly historyLoading  = signal(false);

  readonly photoFile    = signal<File | null>(null);
  readonly photoPreview = signal<string | null>(null);

  allBookings = signal<UserBooking[]>([]);
  pagination  = signal<PaginatedResponse<UserBooking> | null>(null);

  readonly activeBookings = computed(() =>
    this.allBookings().filter(b => b.status === 'confirmed' || b.status === 'pending')
  );
  readonly pastBookings = computed(() =>
    this.allBookings().filter(b => b.status === 'cancelled')
  );

  readonly tabs = [
    { id: 'profile'  as AccountTab, label: 'Mis datos',       icon: '👤' },
    { id: 'password' as AccountTab, label: 'Contraseña',       icon: '🔒' },
    { id: 'bookings' as AccountTab, label: 'Mis reservas',     icon: '🎫' },
    { id: 'history'  as AccountTab, label: 'Historial',        icon: '🗺️'  },
  ];

  profileForm = this.fb.nonNullable.group({
    name:  ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  passForm = this.fb.group(
    {
      current_password:      ['', Validators.required],
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
    readonly auth: AuthService,
    private fb: FormBuilder,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (user) {
      this.profileForm.patchValue({
        name:  user.name,
        email: user.email,
        phone: user.phone ?? '',
      });
    }
    this.loadBookings();
  }

  avatarUrl(): string {
    if (this.photoPreview()) return this.photoPreview()!;
    return this.auth.currentUser?.profile_photo_url ?? this.defaultAvatar();
  }

  defaultAvatar(): string {
    const name = encodeURIComponent(this.auth.currentUser?.name ?? 'U');
    return `https://ui-avatars.com/api/?name=${name}&background=e57e8a&color=fff&size=80`;
  }

  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement).src = this.defaultAvatar();
  }

  onPhotoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('La imagen no puede superar los 5MB.');
      return;
    }
    this.photoFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.photoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  clearPhoto(): void {
    this.photoFile.set(null);
    this.photoPreview.set(null);
  }

  setTab(tab: AccountTab): void {
    this.activeTab.set(tab);
    if (tab === 'history') this.loadHistory(1);
  }

  pTouched(f: string): boolean {
    const c = this.profileForm.get(f);
    return !!(c?.invalid && c?.touched);
  }

  pwTouched(f: string): boolean {
    const c = this.passForm.get(f);
    return !!(c?.invalid && c?.touched);
  }

  saveProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.profileLoading.set(true);
    const { name, email, phone } = this.profileForm.getRawValue();
    const fd = new FormData();
    fd.append('name', name);
    fd.append('email', email);
    if (phone) fd.append('phone', phone);
    if (this.photoFile()) fd.append('profile_photo', this.photoFile()!);
    fd.append('_method', 'PUT');

    this.auth.updateProfile(fd).subscribe({
      next: () => {
        this.profileLoading.set(false);
        this.photoFile.set(null);
        this.toast.success('Perfil actualizado correctamente.');
      },
      error: (err) => {
        this.profileLoading.set(false);
        this.toast.error(err?.error?.message ?? 'Error al actualizar el perfil.');
      },
    });
  }

  changePassword(): void {
    if (this.passForm.invalid) { this.passForm.markAllAsTouched(); return; }
    this.passLoading.set(true);
    this.passError.set('');
    const payload = this.passForm.getRawValue() as {
      current_password: string;
      password: string;
      password_confirmation: string;
    };

    this.auth.changePassword(payload).subscribe({
      next: () => {
        this.passLoading.set(false);
        this.passForm.reset();
        this.toast.success('Contraseña actualizada correctamente.');
      },
      error: (err) => {
        this.passLoading.set(false);
        this.passError.set(err?.error?.message ?? 'Error al cambiar la contraseña.');
      },
    });
  }

  loadBookings(): void {
    this.bookingsLoading.set(true);
    this.auth.getBookings(1).subscribe({
      next: (res) => {
        this.allBookings.set(res.data);
        this.bookingsLoading.set(false);
      },
      error: () => this.bookingsLoading.set(false),
    });
  }

  loadHistory(page: number): void {
    this.historyLoading.set(true);
    this.auth.getBookings(page).subscribe({
      next: (res) => {
        this.allBookings.set(res.data);
        this.pagination.set(res);
        this.historyLoading.set(false);
      },
      error: () => this.historyLoading.set(false),
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      confirmed: 'CONFIRMADO',
      pending:   'PENDIENTE',
      cancelled: 'CANCELADO',
    };
    return map[status] ?? status.toUpperCase();
  }
}
