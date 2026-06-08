// plan.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, shareReplay, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Plan } from '../interfaces/plan-interface';

interface NestPaginated<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number; lastPage: number };
}

interface NestPlan {
  id: number;
  name: string;
  price: string | number;
  devicesAllowed: number;
}

const ACTIVE_PLAN = 'escream_plan';

@Injectable({ providedIn: 'root' })
export class PlanService {

  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/plans`;

  private _currentPlan = signal<Plan | null>(this.readStored());
  readonly currentPlan = this._currentPlan.asReadonly();

  // ✅ Catálogo de planes: petición única compartida entre todos los suscriptores
  private plans$ = this.http.get<NestPaginated<NestPlan>>(this.apiUrl).pipe(
    map(res => res.data.map(p => ({
      id: p.id,
      name: p.name,
      price: String(p.price),
      devicesAllowed: p.devicesAllowed,
    }) as Plan)),
    catchError((err) => {
      console.error('Error al obtener planes:', err);
      return throwError(() => err);
    }),
    shareReplay(1) // ✅ una sola petición HTTP aunque varios componentes se suscriban
  );

  getPlans$(): Observable<Plan[]> {
    return this.plans$;
  }

  setCurrentPlan(plan: Plan): void {
    localStorage.setItem(ACTIVE_PLAN, JSON.stringify(plan));
    this._currentPlan.set(plan);
  }

  clearCurrentPlan(): void {
    localStorage.removeItem(ACTIVE_PLAN);
    this._currentPlan.set(null);
  }

  private readStored(): Plan | null {
    const raw = localStorage.getItem(ACTIVE_PLAN);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Plan;
    } catch {
      return null;
    }
  }
}