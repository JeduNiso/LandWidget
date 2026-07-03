import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthResponse, User, UserBooking, PaginatedResponse } from '../models/auth.models';

const TOKEN_KEY = 'vb_token';

/**
 * AuthService
 *
 * Security note on token storage:
 *   - Currently stores the Sanctum token in localStorage for simplicity.
 *   - For production consider switching to Sanctum SPA mode (httpOnly cookie)
 *     to protect against XSS. The trade-off is that SPA mode requires CORS
 *     same-site setup and a `/sanctum/csrf-cookie` preflight call.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = environment.apiUrl;

  private _currentUser = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this._currentUser.asObservable();

  /** Reactive signal — use in templates / OnPush components */
  readonly isLoggedIn = signal(false);

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      this.isLoggedIn.set(true);
      this.fetchProfile().subscribe({ error: () => this.clearSession() });
    }
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get currentUser(): User | null {
    return this._currentUser.value;
  }

  // ── Session helpers ─────────────────────────────────────────────────────

  private setSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    this._currentUser.next(res.user);
    this.isLoggedIn.set(true);
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._currentUser.next(null);
    this.isLoggedIn.set(false);
  }

  // ── Auth endpoints ──────────────────────────────────────────────────────

  login(email: string, password: string, remember = false): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/login`, { email, password, remember })
      .pipe(tap(res => this.setSession(res)));
  }

  register(payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/register`, payload)
      .pipe(tap(res => this.setSession(res)));
  }

  logout(): Observable<unknown> {
    return this.http.post(`${this.base}/logout`, {}).pipe(
      tap(() => {
        this.clearSession();
        this.router.navigate(['/']);
      })
    );
  }

  // ── Password recovery ───────────────────────────────────────────────────

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/forgot-password`, { email });
  }

  resetPassword(payload: {
    email: string;
    otp: string;
    password: string;
    password_confirmation: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/reset-password`, payload);
  }

  // ── User profile ────────────────────────────────────────────────────────

  fetchProfile(): Observable<User> {
    return this.http.get<User>(`${this.base}/user`).pipe(
      tap(user => {
        this._currentUser.next(user);
        this.isLoggedIn.set(true);
      })
    );
  }

  updateProfile(payload: FormData): Observable<User> {
    return this.http
      .post<User>(`${this.base}/user/profile`, payload)
      .pipe(tap(user => this._currentUser.next(user)));
  }

  changePassword(payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/user/password`, payload);
  }

  // ── Bookings ────────────────────────────────────────────────────────────

  getBookings(page = 1): Observable<PaginatedResponse<UserBooking>> {
    return this.http.get<PaginatedResponse<UserBooking>>(
      `${this.base}/user/bookings?page=${page}`
    );
  }
}
