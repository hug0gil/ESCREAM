import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, of, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Director { id: number; name: string; birthDate?: string; }

@Injectable({ providedIn: 'root' })
export class DirectorService {
  private directorsSubject = new BehaviorSubject<Director[]>([]);
  public directors$ = this.directorsSubject.asObservable();

  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/directors`;

  public getAllDirectors(): Observable<Director[]> {
    return this.http.get<{ data: Director[] }>(this.apiUrl).pipe(
      map(response => response.data),
      tap(directors => this.directorsSubject.next(directors)),
      catchError(err => {
        console.error('Error al obtener los directores:', err);
        this.directorsSubject.next([]);
        return of([]);
      })
    );
  }
}