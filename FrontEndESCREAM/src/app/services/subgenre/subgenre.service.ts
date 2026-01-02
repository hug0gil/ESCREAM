import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, of, tap, map } from 'rxjs';
import { Subgenre } from '../../interfaces/subgenre-interface';

@Injectable({
  providedIn: 'root'
})
export class SubgenreService {

  private subgenresSubject = new BehaviorSubject<Subgenre[]>([]);
  public subgenres$ = this.subgenresSubject.asObservable();

  private http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8000/api/movies/subgenres';

  constructor() { }

  /** Obtiene todos los subgéneros y actualiza el BehaviorSubject */
  public getAllSubgenres(): Observable<Subgenre[]> {
    return this.http.get<{ data: Subgenre[] }>(this.apiUrl).pipe(
      map(response => response.data),
      tap(subgenres => this.subgenresSubject.next(subgenres)),
      catchError(err => {
        console.error('Error al obtener los subgéneros:', err);
        this.subgenresSubject.next([]);
        return of([]);
      })
    );
  }
}
