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

/** Respuesta de /auth/login. */
export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

/** Respuesta de /auth/register. El backend no devuelve token hasta verificar email. */
export interface RegisterResponse {
  user: AuthUser;
  message: string;
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

export interface MessageResponse {
  message: string;
}

export interface EmailChangeResponse extends MessageResponse {
  user: AuthUser;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface RequestEmailChangeRequest {
  newEmail: string;
  currentPassword: string;
}
