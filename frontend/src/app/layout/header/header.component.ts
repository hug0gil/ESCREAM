import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { MovieSearchService } from '../../services/movie/movie-search.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);
  private search = inject(MovieSearchService);

  /** La barra de búsqueda y el botón de filtro solo se muestran en /movies. */
  showSearch = signal(this.isMoviesList(this.router.url));
  searchControl = new FormControl(this.search.value, { nonNullable: true });

  constructor() {
    // Mostrar/ocultar según la ruta.
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => {
        const onList = this.isMoviesList(this.router.url);
        this.showSearch.set(onList);
        if (onList) {
          // Al volver al catálogo, sincroniza el input con el término actual.
          this.searchControl.setValue(this.search.value, { emitEvent: false });
        } else {
          // Al salir del catálogo, cierra el drawer de filtros.
          this.search.closeFilter();
        }
      });

    // Búsqueda en vivo, con un pequeño retardo para no disparar en cada tecla.
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(term => this.search.set(term.trim()));
  }

  /** Abre/cierra el drawer de búsqueda avanzada (lo pinta movies-list). */
  toggleFilter(): void {
    this.search.toggleFilter();
  }

  private isMoviesList(url: string): boolean {
    return url.split('?')[0] === '/movies';
  }

  onClickLink(route: string) {
    // console.log('Click en enlace a', route);
  }
}
