import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError, map, tap, throwError } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Movie } from '../../interfaces/movie-interface';
import { MoviesFilter } from '../../interfaces/movie-filters';
import { Subgenre } from '../../interfaces/subgenre-interface';

interface NestPaginated<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number; lastPage: number };
}

// Movie tal y como llega del back (camelCase + relaciones anidadas por pivot Prisma)
interface NestMovie {
  id: number;
  title: string;
  slug: string;
  year: number;
  synopsis: string;
  image: string;
  rating: string | number;
  country: string;
  directorId: number;
  productionCompanyId: number;
  director?: { id: number; name: string } | null;
  productionCompany?: { id: number; name: string } | null;
  actors?: { actor: { id: number; name: string } }[];
  subgenres?: { subgenre: { id: number; name: string; slug?: string } }[];
}

export interface MoviesFacets {
  countries: string[];
  years: { min: number | null; max: number | null };
  subgenres: Subgenre[];
}

export interface PaginatedMoviesResponse {
  data: Movie[];
  last_page: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class MovieService {
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/movies`;

  // 🎬 Películas que pinta la UI (resultado actual: paginado o filtrado)
  private moviesSubject = new BehaviorSubject<Movie[]>([]);
  public movies$ = this.moviesSubject.asObservable();

  /**
   * Aplana los pivots Prisma (`actors: [{actor:{...}}]`) a forma plana
   * (`actors: [{id,name}]`). El resto del shape ya coincide con la interfaz.
   */
  private mapMovie(m: NestMovie): Movie {
    return {
      id: m.id,
      title: m.title,
      slug: m.slug,
      year: m.year,
      synopsis: m.synopsis,
      image: m.image,
      rating: String(m.rating),
      country: m.country,
      directorId: m.directorId,
      productionCompanyId: m.productionCompanyId,
      director: m.director ?? null,
      productionCompany: m.productionCompany ?? null,
      actors: (m.actors ?? []).map(a => a.actor),
      subgenres: (m.subgenres ?? []).map(s => s.subgenre),
    };
  }

  private buildParams(
    page: number,
    perPage: number,
    filters?: MoviesFilter,
  ): HttpParams {
    let params = new HttpParams()
      .set('page', String(page))
      .set('perPage', String(perPage));

    if (!filters) return params;

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.subgenreIds?.length) {
      filters.subgenreIds.forEach(id => {
        params = params.append('subgenreIds', String(id));
      });
    }
    if (filters.countries?.length) {
      filters.countries.forEach(country => {
        params = params.append('countries', country);
      });
    }
    if (filters.rating?.length) {
      filters.rating.forEach(r => {
        params = params.append('rating', String(r));
      });
    }
    if (filters.yearRange?.min !== undefined) {
      params = params.set('yearMin', String(filters.yearRange.min));
    }
    if (filters.yearRange?.max !== undefined) {
      params = params.set('yearMax', String(filters.yearRange.max));
    }
    return params;
  }

  public getMoviesPaginated(
    page: number = 1,
    perPage: number = 10,
    filters?: MoviesFilter,
  ): Observable<PaginatedMoviesResponse> {
    const params = this.buildParams(page, perPage, filters);

    return this.http.get<NestPaginated<NestMovie>>(this.apiUrl, { params }).pipe(
      map(response => ({
        data: response.data.map(m => this.mapMovie(m)),
        last_page: response.meta.lastPage,
        total: response.meta.total,
      })),
      tap(response => this.moviesSubject.next(response.data)),
      catchError(err => {
        console.error('Error al obtener películas:', err);
        this.moviesSubject.next([]);
        return of({ data: [], last_page: 1, total: 0 });
      }),
    );
  }

  /** Wrapper "filtrar": resetea a página 1 y llama al paginado con filtros. */
  public filterMovies(
    filters: MoviesFilter,
    perPage: number = 10,
  ): Observable<PaginatedMoviesResponse> {
    return this.getMoviesPaginated(1, perPage, filters);
  }

  /**
   * Trae una muestra de películas SIN tocar el estado de la lista
   * (`moviesSubject`). Útil para secciones tipo "destacada" que conviven
   * con la lista paginada sin pisarla.
   */
  public getSample(perPage: number = 50): Observable<Movie[]> {
    const params = new HttpParams()
      .set('page', '1')
      .set('perPage', String(perPage));

    return this.http.get<NestPaginated<NestMovie>>(this.apiUrl, { params }).pipe(
      map(response => response.data.map(m => this.mapMovie(m))),
      catchError(err => {
        console.error('Error al obtener muestra de películas:', err);
        return of([]);
      }),
    );
  }

  /** Datos para llenar los selectores del filtro (countries, years, subgenres). */
  public getFacets(): Observable<MoviesFacets> {
    return this.http.get<MoviesFacets>(`${this.apiUrl}/facets`).pipe(
      catchError(err => {
        console.error('Error al obtener facets:', err);
        return of({ countries: [], years: { min: null, max: null }, subgenres: [] });
      }),
    );
  }

  /** Detalle por slug. */
  public getMovieBySlug(slug: string): Observable<Movie> {
    return this.http.get<NestMovie>(`${this.apiUrl}/slug/${slug}`).pipe(
      map(raw => this.mapMovie(raw)),
      catchError(err => {
        console.error(`Error al obtener película ${slug}:`, err);
        return throwError(() => err);
      }),
    );
  }
}
