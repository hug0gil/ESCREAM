import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError, map, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Movie } from '../../interfaces/movie-interface';

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  private http = inject(HttpClient);
  private ip = "127.0.0.1";

  // API base
  private readonly apiUrl = `http://${this.ip}:8000/api/movies`;
  private readonly apiAllUrl = `http://${this.ip}:8000/api/movies/all`;


  // 🎬 Caché de películas paginadas
  private paginatedMoviesSubject = new BehaviorSubject<Movie[]>([]);
  public paginatedMovies$ = this.paginatedMoviesSubject.asObservable();

  // 🎬 Caché de todas las películas
  private allMoviesSubject = new BehaviorSubject<Movie[]>([]);
  public allMovies$ = this.allMoviesSubject.asObservable();

  // 🌍 Países únicos derivados de todas las películas
  public allCountries$ = this.allMovies$.pipe(
    map(movies => Array.from(new Set(movies.map(movie => {
      return movie.country
    }))))
  );

  /**
   * Obtiene películas paginadas desde el backend y actualiza el subject
   */
  public getMoviesPaginated(
    page: number = 1,
    perPage: number = 10
  ): Observable<{ data: Movie[]; last_page: number }> {
    const url = `${this.apiUrl}?per_page=${perPage}&page=${page}`;
    return this.http.get<{ data: Movie[]; last_page: number }>(url).pipe(
      tap(response => this.paginatedMoviesSubject.next(response.data)),
      catchError(err => {
        console.error('Error al obtener películas paginadas:', err);
        this.paginatedMoviesSubject.next([]);
        return of({ data: [], last_page: 1 });
      })
    );
  }

  /**
   * Obtiene todas las películas desde el backend y actualiza la caché
   */
  public getAllMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(this.apiAllUrl).pipe(
      tap(movies => this.allMoviesSubject.next(movies)), // tap solo se ejecuta una vez
      catchError(err => {
        console.error('Error al obtener todas las películas: ', err);
        this.allMoviesSubject.next([]);
        return of([]);
      })
    );
  }

  // public getFilteredMovies(filters): Observable<Movie[]> {
  //   return this.http.get<Movie[]>(this.apiAllUrl).pipe(
  //     tap(movies => this.allMoviesSubject.next(movies)),
  //     catchError(err => {
  //       console.error('Error al obtener las películas filtradas: ', err);
  //       this.allMoviesSubject.next([]);
  //       return of([]);
  //     })
  //   );
  // }

  /**
   * Devuelve todos los países en un observable reactivo
   */

  public getAllCountries$(): Observable<string[]> {
    return this.allCountries$;
  }

  /**
   * Devuelve todas las películas en un observable reactivo
   */
  public getAllMovies$(): Observable<Movie[]> {
    return this.allMovies$;
  }

  /**
   * Devuelve las películas paginadas en un observable reactivo
   */
  public getPaginatedMovies$(): Observable<Movie[]> {
    return this.paginatedMovies$;
  }

  /**
   * Obtiene una película por slug. Busca primero en caché, si no está llama a la API
   */
  public getMovieBySlug(slug: string): Observable<Movie> {
    const url = `${this.apiUrl}/slug/${slug}`;
    return this.http.get<Movie>(url).pipe(
      tap(movie => {
        // Actualizar caché de todas las películas
        const currentMovies = this.allMoviesSubject.value;
        this.allMoviesSubject.next([...currentMovies, movie]);
      }),
      catchError(err => {
        console.error(`Error al obtener película ${slug}:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Añadir manualmente una película a la caché de todas las películas
   */
  public addMovieToCache(newMovie: Movie) {
    const currentMovies = this.allMoviesSubject.value;
    this.allMoviesSubject.next([...currentMovies, newMovie]);
  }
}
