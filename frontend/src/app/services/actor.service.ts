import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, of, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Actor { id: number; name: string; country?: string; birthDate?: string; }

@Injectable({ providedIn: 'root' })
export class ActorService {
  private actorsSubject = new BehaviorSubject<Actor[]>([]);
  public actors$ = this.actorsSubject.asObservable();

  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/actors`;

  public getAllActors(): Observable<Actor[]> {
    return this.http.get<{ data: Actor[] }>(this.apiUrl).pipe(
      map(response => response.data),
      tap(actors => this.actorsSubject.next(actors)),
      catchError(err => {
        console.error('Error al obtener los actores:', err);
        this.actorsSubject.next([]);
        return of([]);
      })
    );
  }
}