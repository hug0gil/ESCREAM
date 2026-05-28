import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  AuthUser,
  ChangeSubscriptionRequest,
  LoginRequest,
  RefreshResponse,
  RegisterRequest,
  Role,
} from '../../interfaces/auth-interface';

const TOKEN_KEY = 'escream_token';
const USER_KEY = 'escream_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Estado reactivo del usuario autenticado (se rehidrata de localStorage al cargar)
  private _currentUser = signal<AuthUser | null>(this.readStoredUser());
  readonly currentUser = this._currentUser.asReadonly();

  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly role = computed<Role | null>(() => this._currentUser()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'ADMIN');
  /** EDITOR o ADMIN (un admin puede hacer todo lo de un editor). */
  readonly canEdit = computed(() => this.hasRole('EDITOR', 'ADMIN'));

  // ============================================================
  // SESIÓN: register / login / logout
  // ============================================================
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(tap(res => this.persistSession(res)));
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, data)
      .pipe(tap(res => this.persistSession(res)));
  }

  /** Cierra sesión eliminando el token (y el usuario) y vuelve a /login. */
  logout(): void {
    this.clearSession();
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

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasRole(...roles: Role[]): boolean {
    const r = this.role();
    return r !== null && roles.includes(r);
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

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
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
