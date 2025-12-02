import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  tap,
  throwError,
  of
} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Movie } from '../../interfaces/movie-interface';


@Injectable({
  providedIn: 'root',
})
export class MovieService {
  // Estado interno
  private movies: Movie[] = [];

  // Subject reactivo con valor inicial vacío
  private moviesSubject = new BehaviorSubject<Movie[]>([]);
  public movies$: Observable<Movie[]> = this.moviesSubject.asObservable();

  private http = inject(HttpClient);

  private ip = "127.0.0.1"

  private readonly apiUrl = `http://${this.ip}:8000/api/movies?per_page=30`;

  constructor() {
    this.getMoviesPaginated();
  }

  /**
   * Obtiene películas paginadas desde el backend.
   */
  getMoviesPaginated(page: number = 1, perPage: number = 10): Observable<{ data: Movie[], last_page: number }> {
    const url = `http://${this.ip}:8000/api/movies?per_page=${perPage}&page=${page}`;
    return this.http.get<{ data: Movie[], last_page: number }>(url)
      .pipe(
        tap(response => {
          this.moviesSubject.next(response.data);
        }),
        catchError(err => {
          console.error('Error al obtener películas paginadas:', err);
          this.moviesSubject.next([]);
          return throwError(() => err);
        })
      );
  }

  /**
   * Devuelve un observable con todas las películas.
   */
  getMovies$(): Observable<Movie[]> {
    return this.movies$;
  }

  /**
   * Obtiene una película por ID desde la caché (sin petición HTTP).
   */
  getMovieBySlug(slug: string): Observable<Movie> {
    // 1. Buscar en caché
    const cachedMovie = this.moviesSubject.value.find(m => m.slug === slug);

    if (cachedMovie) {
      return of(cachedMovie);
    }

    // 2. Si no está en caché, pedirla por API
    console.log("Petición API slug: " + slug)
    const url = `http://${this.ip}:8000/api/movies/slug/${slug}`;
    console.log(url)
    return this.http.get<Movie>(url).pipe(
      catchError(err => {
        console.error('❌ Error al obtener película por ID:', err);
        return throwError(() => err);
      })
    );
  }
}
