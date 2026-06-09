import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MovieService } from '../../../services/movie/movie.service';
import { debounceTime, distinctUntilChanged, finalize, Subject, takeUntil } from 'rxjs';
import { Movie } from '../../../interfaces/movie-interface';

@Component({
  selector: 'app-admin-movie-list',
  standalone: true,
  imports: [],
  templateUrl: './admin-movie-list.component.html',
  styleUrl: './admin-movie-list.component.css'
})
export class AdminMovieListComponent implements OnInit, OnDestroy {
  private movieService = inject(MovieService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private searchInput$ = new Subject<string>();

  movies = signal<Movie[]>([]);
  loading = signal(false);
  deleting = signal(false);
  seedingImages = signal(false);
  total = signal(0);
  lastPage = signal(1);
  currentPage = signal(1);
  toast = signal<string | null>(null);
  movieToDelete = signal<Movie | null>(null);

  searchTerm = '';
  perPage = 10;

  visiblePages = computed(() => {
    const cur = this.currentPage();
    const last = this.lastPage();
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
    const pages: (number | string)[] = [1];
    if (cur > 3) pages.push('...');
    for (let p = Math.max(2, cur - 1); p <= Math.min(last - 1, cur + 1); p++) {
      pages.push(p);
    }
    if (cur < last - 2) pages.push('...');
    pages.push(last);
    return pages;
  });

  ngOnInit() {
    this.searchInput$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadMovies();
      });
    this.loadMovies();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMovies() {
    this.loading.set(true);

    const filters = {
      search: this.searchTerm,
      subgenreIds: [],
      rating: [],
      countries: [],
      yearRange: {
        min: 0,
        max: 9999
      }
    };

    this.movieService
      .getMoviesPaginated(
        this.currentPage(),
        this.perPage,
        filters
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.movies.set(res.data);
          this.total.set(res.total);
          this.lastPage.set(res.last_page);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  onSearchChange(value: string) {
    this.searchTerm = value;
    this.searchInput$.next(value);
  }

  clearSearch() {
    this.searchTerm = '';
    this.currentPage.set(1);
    this.loadMovies();
  }

  onPerPageChange() {
    this.currentPage.set(1);
    this.loadMovies();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.lastPage() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadMovies();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToCreate() {
    this.router.navigate(['/admin-dashboard/movies/new']);
  }

  goToEdit(id: number) {
    this.router.navigate(['/admin-dashboard/movies', id, 'edit']);
  }

  seedImages() {
    if (this.seedingImages()) return;

    this.seedingImages.set(true);
    this.movieService.seedMissingImages()
      .pipe(
        finalize(() => this.seedingImages.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          this.showToast(`Imágenes actualizadas: ${res.updated}/${res.processed}`);
          this.loadMovies();
        },
        error: () => {
          this.showToast('No se pudieron actualizar las imágenes');
        }
      });
  }

  confirmDelete(movie: Movie) {
    this.movieToDelete.set(movie);
  }

  cancelDelete() {
    this.movieToDelete.set(null);
  }

  deleteMovie() {
    const movie = this.movieToDelete();
    if (!movie) return;

    this.deleting.set(true);

    this.movieService.deleteMovie(movie.id)
      .pipe(
        finalize(() => this.deleting.set(false))
      )
      .subscribe({
        next: () => {
          this.movies.update(list =>
            list.filter(m => m.id !== movie.id)
          );

          this.total.update(t => t - 1);
          this.movieToDelete.set(null);

          this.showToast(`"${movie.title}" eliminada`);
        }
      });
  }
  private showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 3000);
  }
}
