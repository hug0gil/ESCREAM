import {
  Component,
  inject,
  signal,
  ElementRef,
  viewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { skip, distinctUntilChanged } from 'rxjs';
import { Movie } from '../../../interfaces/movie-interface';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MovieService } from '../../../services/movie/movie.service';
import { MovieListStateService } from '../../../services/movie/movie-list-state.service';
import { MovieSearchService } from '../../../services/movie/movie-search.service';
import { SkeletonLoaderComponent } from "../../skeleton-loader/skeleton-loader.component";
import { MoviesFilterComponent } from "../movies-filter/movies-filter.component";
import { MoviePosterCardComponent } from "../movie-poster-card/movie-poster-card.component";
import { MoviesFilter } from '../../../interfaces/movie-filters';
import { Subgenre } from '../../../interfaces/subgenre-interface';

@Component({
  selector: 'app-movies-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonLoaderComponent, MoviesFilterComponent, MoviePosterCardComponent],
  templateUrl: './movies-list.component.html',
  styleUrls: ['./movies-list.component.css'],
})
export class MoviesListComponent implements OnInit, AfterViewInit, OnDestroy {
  private moviesService = inject(MovieService);
  private state = inject(MovieListStateService);
  private search = inject(MovieSearchService);
  private destroyRef = inject(DestroyRef);

  public subgenres: Subgenre[] = [];   // Subgéneros para el selector del filtro
  public countries: string[] = [];     // Países disponibles (facets)
  public movies: Movie[] = [];         // Películas acumuladas (scroll infinito)

  /** Estado del drawer de filtros, compartido con el botón ⛭ del header. */
  get filterOpen() {
    return this.search.filterOpen();
  }

  // Película destacada del billboard (rota cada 3 días). Se carga aparte de
  // la lista para no interferir con el scroll infinito.
  public featured = signal<Movie | null>(null);

  public yearRangeLimits: { min: number; max: number } = {
    min: 1900,
    max: new Date().getFullYear(),
  };
  public currentFilters: MoviesFilter | null = null;

  // ====== Scroll infinito ======
  private page = 1;
  private readonly batchSize = 18;       // pelis por carga (3 filas de 6)
  public loading = signal(false);
  public reachedEnd = signal(false);

  // Skeletons solo para la primera carga.
  public skeletons = new Array(this.batchSize);

  // Centinela al final de la lista; cuando entra en pantalla, pedimos más.
  sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');
  private observer?: IntersectionObserver;
  private sentinelVisible = false;

  // Restauración de estado al volver del detalle.
  private restored = false;
  private restoringScroll = false;

  ngOnInit() {
    this.loadFacets();
    this.loadFeatured();

    if (this.state.hasState) {
      // Volvemos del detalle: restauramos lista, filtros y página.
      this.currentFilters = this.state.filters;
      this.movies = this.state.movies;
      this.page = this.state.page;
      this.reachedEnd.set(this.state.reachedEnd);
      this.restored = true;
      this.restoringScroll = true; // ignora al observer hasta restaurar scroll
    } else {
      this.loadMore(true); // primera visita
    }

    // La barra del header escribe aquí: al cambiar el término, recargamos.
    // skip(1) ignora el valor inicial (ya aplicado en la carga/restauración).
    this.search.search$
      .pipe(skip(1), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        window.scrollTo({ top: 0 });
        this.loadMore(true);
      });
  }

  /** Filtros efectivos = filtros avanzados + término de búsqueda del header. */
  private effectiveFilters(): MoviesFilter {
    return {
      ...(this.currentFilters ?? ({} as MoviesFilter)),
      search: this.search.value,
    };
  }

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(
      entries => {
        this.sentinelVisible = entries[0].isIntersecting;
        if (this.sentinelVisible && !this.restoringScroll) this.loadMore();
      },
      { rootMargin: '400px' }, // dispara 400px ANTES de llegar al fondo
    );

    const el = this.sentinel()?.nativeElement;
    if (el) this.observer.observe(el);

    // Restaura la posición de scroll una vez pintada la lista. Las cards tienen
    // alto fijo (aspect-ratio), así que la altura es correcta sin esperar imágenes.
    if (this.restored) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: this.state.scrollY });
        this.restoringScroll = false;
      });
    }
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    // Guarda el estado para restaurarlo al volver.
    this.state.save({
      filters: this.currentFilters,
      movies: this.movies,
      page: this.page,
      reachedEnd: this.reachedEnd(),
      scrollY: window.scrollY,
    });
  }

  /**
   * Carga el siguiente lote y lo añade a la lista. Con `reset` (primera carga
   * o cambio de filtros) vacía la lista y empieza desde la página 1.
   */
  loadMore(reset = false) {
    if (this.loading()) return;
    if (reset) {
      this.page = 1;
      this.reachedEnd.set(false);
    } else if (this.reachedEnd()) {
      return;
    }

    this.loading.set(true);
    const filters = this.effectiveFilters();

    this.moviesService.getMoviesPaginated(this.page, this.batchSize, filters).subscribe({
      next: res => {
        this.movies = reset ? res.data : [...this.movies, ...res.data];
        if (this.page >= res.last_page || res.data.length === 0) {
          this.reachedEnd.set(true);
        }
        this.page++;
        this.loading.set(false);

        // Si el centinela sigue a la vista (contenido corto), sigue llenando.
        if (this.sentinelVisible && !this.reachedEnd()) {
          this.loadMore();
        }
      },
      error: err => {
        console.error('Error cargando películas:', err);
        this.loading.set(false);
      },
    });
  }

  /** Recibe los filtros del hijo, cierra el drawer y recarga desde el principio. */
  onFiltersChange(filters: MoviesFilter) {
    this.currentFilters = filters;
    this.search.closeFilter(); // cerrar el drawer al aplicar
    this.loadMore(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Carga la película destacada del billboard: cambia cada 3 días. */
  private loadFeatured() {
    this.moviesService.getSample(50).subscribe(movies => {
      if (!movies.length) return;

      // Cambia cada 3 días: índice estable derivado del "bloque" de 3 días
      // actual (días desde epoch / 3). Misma peli durante 3 días, luego rota.
      const periodOf3Days = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 3));
      const index = periodOf3Days % movies.length;
      this.featured.set(movies[index]);

      // --- ANTES: aleatoria en CADA recarga. Descomenta para volver a esto
      //     (y comenta las 3 líneas de arriba):
      // const random = movies[Math.floor(Math.random() * movies.length)];
      // this.featured.set(random);
    });
  }

  /** Array de longitud = nota (1-5) para pintar esa cantidad de 💀. */
  skulls(rating: string): number[] {
    return Array(Math.round(Number(rating) || 0)).fill(0);
  }

  /** Pide los datos para los selectores del filtro y los límites de año. */
  loadFacets() {
    this.moviesService.getFacets().subscribe({
      next: facets => {
        this.countries = facets.countries;
        this.subgenres = facets.subgenres;
        if (facets.years.min !== null && facets.years.max !== null) {
          this.yearRangeLimits = {
            min: facets.years.min,
            max: Math.max(facets.years.max, new Date().getFullYear()),
          };
        }
      },
      error: err => console.error('Error cargando facets:', err),
    });
  }

  closeFilter() {
    this.search.closeFilter();
  }
}
