import { inject, Injectable } from '@angular/core';
import { Plan } from '../../interfaces/plan-interface';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PlanService {

  private plans: Plan[] = [];

  private plansSubject = new BehaviorSubject<Plan[]>([]);
  private plans$: Observable<Plan[]> = this.plansSubject.asObservable();

  private http = inject(HttpClient);

  private ip = "127.0.0.1"

  private readonly apiUrl = `http://${this.ip}:8000/api/movies/plans`;

  constructor() {
    this.getAllPlans();
  }


  getAllPlans(): void {
    console.log("Loading plans")
    this.http.get<Plan[]>(this.apiUrl).pipe(
      tap((plans) => {
        this.plans = plans
        this.plansSubject.next([...this.plans])
        console.log('Planes obtenidos de la bdd:', this.plans);
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

