import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { MovieSearchService } from '../../services/movie/movie-search.service';
import { ProfileService } from '../../services/profile.service';

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
  protected profileService = inject(ProfileService);
  private elementRef = inject(ElementRef);

  /** La barra de búsqueda y el botón de filtro solo se muestran en /movies. */
  protected showSearch = signal(this.isMoviesList(this.router.url));
  protected searchControl = new FormControl(this.search.value, { nonNullable: true });
  protected menuOpen = signal(false);


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

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  go(path: string): void {
    this.menuOpen.set(false);
    this.router.navigate([path]);
  }

  /**
   * Escucha cualquier click realizado en el documento.
   *
   * Si el menú está abierto y el click se produce fuera del
   * componente Header, se cierra automáticamente.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {

    // No hacemos nada si el menú ya está cerrado.
    if (!this.menuOpen()) {
      return;
    }

    // Comprueba si el elemento pulsado pertenece al Header.
    const clickedInsideHeader =
      this.elementRef.nativeElement.contains(event.target);

    // Si el click fue fuera del Header, cerramos el menú.
    if (!clickedInsideHeader) {
      this.menuOpen.set(false);
    }
  }

  onLogoClick(): void {
    const currentPath = this.router.url.split('?')[0];
    switch (currentPath) {
      case '/movies':
        this.router.navigate(['']);
        break;

      case '/profiles':
        console.log('profiles')
        if (this.profileService.activeProfile()) {
          this.router.navigate(['/movies']);
        } else {
          this.router.navigate(['']);
        }
        break;

      default:
        this.router.navigate(['/movies']);
        break;
    }
  }

}
