import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProfileService } from '../profile.service';
import {
  AuthResponse,
  AuthUser,
  ChangeSubscriptionRequest,
  EmailChangeResponse,
  LoginRequest,
  MessageResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  RequestEmailChangeRequest,
  ResetPasswordRequest,
  Role,
} from '../../interfaces/auth-interface';

const TOKEN_KEY = 'escream_token';
const USER_KEY = 'escream_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private profiles = inject(ProfileService);
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly usersUrl = `${environment.apiUrl}/users`;

  // Estado reactivo del usuario autenticado (se rehidrata de localStorage al cargar)
  private _currentUser = signal<AuthUser | null>(this.readStoredUser());
  readonly currentUser = this._currentUser.asReadonly();

  readonly isAuthenticated = computed(() => this.currentUser() !== null && this.profiles.activeProfile() !== null);
  readonly hasSelectedProfile = computed(() => this.currentUser() !== null);
  readonly role = computed<Role | null>(() => this._currentUser()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'ADMIN');
  /** EDITOR o ADMIN (un admin puede hacer todo lo de un editor). */
  readonly canEdit = computed(() => this.hasRole('EDITOR', 'ADMIN'));

  // ============================================================
  // SESIÓN: register / login / logout
  // ============================================================
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data);
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, data)
      .pipe(
        tap(res => this.persistSession(res))
      );
  }

  /** Cierra sesión eliminando el token, el usuario y el perfil activo. */
  logout(): void {
    this.clearSession(['/']);
  }

  // ============================================================
  // TOKEN / USUARIO ACTUAL
  // ============================================================
  /** Renueva el access token contra /auth/refresh. */
  refresh(): Observable<RefreshResponse> {
    return this.http
      .post<RefreshResponse>(`${this.apiUrl}/refresh`, {})
      .pipe(tap(res => localStorage.setItem(TOKEN_KEY, res.token)));
  }

  /**
   * Trae el usuario actual desde /auth/who y refresca el estado local.
   * Útil al arrancar la app para validar la sesión (rol fresco de BD).
   */
  fetchCurrentUser(): Observable<AuthUser> {
    return this.http
      .get<AuthUser>(`${this.apiUrl}/who`)
      .pipe(tap(user => this.setUser(user)));
  }

  changeSubscription(planId: number): Observable<AuthUser> {
    const body: ChangeSubscriptionRequest = { planId };
    return this.http
      .patch<AuthUser>(`${this.apiUrl}/changeSubscription`, body)
      .pipe(tap(user => this.setUser(user)));
  }

  updateCurrentUser(data: Partial<Pick<AuthUser, 'name' | 'email'>>): Observable<AuthUser> {
    const user = this.currentUser();
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    return this.http
      .patch<AuthUser>(`${this.usersUrl}/${user.id}`, data)
      .pipe(tap(updated => this.setUser(updated)));
  }

  verifyEmail(token: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/verify-email`, { token });
  }

  resendVerification(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/resend-verification`, { email });
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(data: ResetPasswordRequest): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.apiUrl}/reset-password`, data)
      .pipe(tap(() => this.clearSession()));
  }

  requestEmailChange(data: RequestEmailChangeRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/request-email-change`, data);
  }

  confirmEmailChange(token: string): Observable<EmailChangeResponse> {
    return this.http
      .post<EmailChangeResponse>(`${this.apiUrl}/confirm-email-change`, { token })
      .pipe(
        tap(res => {
          if (this.currentUser()?.id === res.user.id) {
            this.setUser(res.user);
          }
        }),
      );
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasRole(...roles: Role[]): boolean {
    const r = this.role();
    return r !== null && roles.includes(r);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser();
  }

  // ============================================================
  // HELPERS PRIVADOS DE PERSISTENCIA
  // ============================================================
  private persistSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    this.setUser(res.user);
  }

  private setUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._currentUser.set(user);
  }

  private clearSession(redirectTo?: string[]): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    this.profiles.clearProfile();
    if (redirectTo) {
      this.router.navigate(redirectTo);
    }
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
