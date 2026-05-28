import { inject, Injectable } from '@angular/core';
import { Plan } from '../../interfaces/plan-interface';
import { BehaviorSubject, catchError, map, Observable, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Shape de respuesta paginada que devuelve Nest
interface NestPaginated<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number; lastPage: number };
}

// Plan tal y como llega del back (camelCase)
interface NestPlan {
  id: number;
  name: string;
  price: string | number;
  devicesAllowed: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlanService {

  private plans: Plan[] = [];

  private plansSubject = new BehaviorSubject<Plan[]>([]);
  private plans$: Observable<Plan[]> = this.plansSubject.asObservable();

  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/plans`;

  constructor() {
    this.getAllPlans();
  }


  getAllPlans(): void {
    this.http.get<NestPaginated<NestPlan>>(this.apiUrl).pipe(
      map(response => response.data.map(p => ({
        id: p.id,
        name: p.name,
        price: String(p.price),
        devicesAllowed: p.devicesAllowed,
      }) as Plan)),
      tap((plans) => {
        this.plans = plans
        this.plansSubject.next([...this.plans])
        // console.log('Planes obtenidos de la bdd:', this.plans);
      }),
      catchError((error) => {
        console.error('Error al obtener los planes de subscripción:', error);
        this.plansSubject.next([]);
        return throwError(() => error);
      })
    )
      .subscribe();
  }

  /** Método público para recargar películas si se necesita */
  reloadPlans(): void {
    this.getAllPlans();
  }

  getPlans$(): Observable<Plan[]> {
    return this.plans$;
  }
}
