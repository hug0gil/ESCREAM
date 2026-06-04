import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Profile } from '../../interfaces/profile-interface';

// Shape de respuesta paginada que devuelve Nest
interface NestPaginated<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number; lastPage: number };
}

const ACTIVE_PROFILE_KEY = 'escream_profile';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/profiles`;

  // Perfil activo (se rehidrata de localStorage al cargar)
  private _activeProfile = signal<Profile | null>(this.readStored());
  readonly activeProfile = this._activeProfile.asReadonly();

  /** Lista de perfiles del usuario indicado. */
  getByUser$(userId: number): Observable<Profile[]> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('perPage', 50);
    return this.http
      .get<NestPaginated<Profile>>(this.apiUrl, { params })
      .pipe(map(res => res.data));
  }

  /** Marca el perfil con el que se va a navegar y lo persiste. */
  selectProfile(profile: Profile): void {
    localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(profile));
    this._activeProfile.set(profile);
  }

  /** Olvida el perfil activo (p. ej. al cerrar sesión). */
  clearProfile(): void {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
    this._activeProfile.set(null);
  }

  private readStored(): Profile | null {
    const raw = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Profile;
    } catch {
      return null;
    }
  }
}
