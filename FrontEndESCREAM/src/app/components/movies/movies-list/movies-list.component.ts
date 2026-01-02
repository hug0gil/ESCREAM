import { Component, inject } from '@angular/core';
import { Movie } from '../../../interfaces/movie-interface';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MovieService } from '../../../services/movie/movie.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { SkeletonLoaderComponent } from "../../skeleton-loader/skeleton-loader.component";
import { MoviesFilterComponent } from "../movies-filter/movies-filter.component";
import { MoviesFilter } from '../../../interfaces/movie-filters';
import { SubgenreService } from '../../../services/subgenre/subgenre.service';

@Component({
  selector: 'app-movies-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonLoaderComponent, MoviesFilterComponent],
  templateUrl: './movies-list.component.html',
  styleUrls: ['./movies-list.component.css'],
  animations: [
  trigger('filterMenuAnimation', [
    transition(':enter', [
      style({
        opacity: 0,
        transform: 'translateY(-20px)'
      }),
      animate('0.4s ease-out', style({
        opacity: 1,
        transform: 'translateY(0)'
      }))
    ]),
    transition(':leave', [
      animate('0.3s ease-in', style({
        opacity: 0,
        transform: 'translateY(-20px)'
      }))
    ])
  ])
]
})
export class MoviesListComponent {
  private moviesService = inject(MovieService);
  private subgenreService = inject(SubgenreService)

  public allMovies: Movie[] = [];       // Todas las películas (para filtros si necesitas)
  public subgenres: string[] = [];      // Todos los subgéneros de las películas
  public countries: string[] = [];      // Observable de países (solo lectura, pasado al filtro)
  public paginatedMovies: Movie[] = []; // Películas de la página actual
  public skeletons = new Array(6);      // Skeleton loaders
  public showFilter: boolean = false;   // Mostrar/ocultar filtro
  public yearRangeLimits: { min: number; max: number } = { min: 1900, max: new Date().getFullYear() };

  public currentPage = 1;
  public lastPage = 1;
  public perPage = 6;



  ngOnInit() {
    this.loadAllMovies();
    this.loadPaginatedMovies();
    this.loadSubgenres();

    this.moviesService.getAllCountries$().subscribe({
      next: data => this.countries = data,
      error: () => this.countries = []
    });
  }

  // ========================
  // CARGA DE DATOS
  // ========================

  loadAllMovies() {
    this.moviesService.getAllMovies().subscribe({
      next: movies => {
        this.allMovies = movies;

        // Año mínimo y máximo
        const years = movies.map(m => m.year);
        this.yearRangeLimits = {
          min: Math.min(...years),
          max: Math.max(...years, new Date().getFullYear()) // asegurar que no pase del actual
        };
      },
      error: err => console.error(err)
    });
  }

  loadPaginatedMovies(page: number = 1) {
    this.currentPage = page;

    this.moviesService.getMoviesPaginated(this.currentPage, this.perPage).subscribe({
      next: response => {
        this.paginatedMovies = response.data;
        this.lastPage = response.last_page;
      },
      error: err => console.error('❌ Error al cargar las películas paginadas:', err)
    });
  }

  loadSubgenres() {
    this.subgenreService.getAllSubgenres().subscribe({
      next: subgenres => {
        this.subgenres = subgenres.map(s => s.name);
      },
      error: err => console.error(err)
    });
  }

  // ========================
  // PAGINACIÓN
  // ========================

  nextPage() {
    if (this.currentPage < this.lastPage) {
      this.loadPaginatedMovies(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.loadPaginatedMovies(this.currentPage - 1);
    }
  }

  // ========================
  // NAVEGACIÓN
  // ========================

  goToMovieDetail(movieSlug: string) {
    console.log('Ir a detalle de película:', movieSlug);
  }

  // ========================
  // FILTROS
  // ========================

  toggleFilter() {
    this.showFilter = !this.showFilter;
  }

  // Se ejecuta cuando el componente hijo emite filtros
  onFiltersChange(filters: MoviesFilter) {

    // this.moviesService.getFilteredMovies(filters).subscribe({
    //   next: movies => {
    //     this.allMovies = movies;
    //     this.paginatedMovies = movies.slice(0, this.perPage);
    //     this.lastPage = Math.ceil(movies.length / this.perPage);
    //   },
    //   error: err => console.error('❌ Error al filtrar películas:', err)
    // });
  }
}
