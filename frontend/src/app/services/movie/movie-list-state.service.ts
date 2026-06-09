import { Injectable } from '@angular/core';
import { Movie } from '../../interfaces/movie-interface';
import { MoviesFilter } from '../../interfaces/movie-filters';

/**
 * Guarda en memoria el estado del listado de películas (filtros, lista cargada
 * por scroll infinito, página y scroll) para poder restaurarlo al volver desde
 * el detalle de una película. Es singleton (providedIn: 'root'), así sobrevive
 * a la destrucción del componente. Se pierde al recargar la página (F5).
 */
@Injectable({ providedIn: 'root' })
export class MovieListStateService {
  /** Hay un estado guardado pendiente de restaurar. */
  hasState = false;

  filters: MoviesFilter | null = null;
  movies: Movie[] = [];
  page = 1;
  reachedEnd = false;
  total = 0;
  scrollY = 0;

  save(state: {
    filters: MoviesFilter | null;
    movies: Movie[];
    page: number;
    reachedEnd: boolean;
    total: number;
    scrollY: number;
  }) {
    this.filters = state.filters;
    this.movies = state.movies;
    this.page = state.page;
    this.reachedEnd = state.reachedEnd;
    this.total = state.total;
    this.scrollY = state.scrollY;
    this.hasState = true;
  }

  clear() {
    this.hasState = false;
    this.filters = null;
    this.movies = [];
    this.page = 1;
    this.reachedEnd = false;
    this.total = 0;
    this.scrollY = 0;
  }
}
