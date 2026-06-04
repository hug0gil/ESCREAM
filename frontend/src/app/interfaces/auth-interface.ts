export type Role = 'USER' | 'EDITOR' | 'ADMIN';

/** Usuario autenticado tal y como lo devuelve el backend (sin password). */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  subscribed: boolean;
  planId: number;

  selectedProfileId?: number;

  startDate?: string;
  endDate?: string | null;
  emailVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/** Respuesta de /auth/login y /auth/register. */
export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

/** Respuesta de /auth/refresh (ojo: el back devuelve `token`, no `access_token`). */
export interface RefreshResponse {
  token: string;
  token_type: string;
}

export interface ChangeSubscriptionRequest {
  planId: number;
}

/** Respuesta de /auth/logout. */
export interface LogoutResponse {
  message: string;
}
