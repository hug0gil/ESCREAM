import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, of, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProductionCompany { id: number; name: string; country?: string; }

@Injectable({ providedIn: 'root' })
export class ProductionCompanyService {
  private companiesSubject = new BehaviorSubject<ProductionCompany[]>([]);
  public companies$ = this.companiesSubject.asObservable();

  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/production-companies`;

  public getAllCompanies(): Observable<ProductionCompany[]> {
    return this.http.get<{ data: ProductionCompany[] }>(this.apiUrl).pipe(
      map(response => response.data),
      tap(companies => this.companiesSubject.next(companies)),
      catchError(err => {
        console.error('Error al obtener las productoras:', err);
        this.companiesSubject.next([]);
        return of([]);
      })
    );
  }
}