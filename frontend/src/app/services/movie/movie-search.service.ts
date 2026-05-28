import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Término de búsqueda en vivo, compartido entre la barra del header y el
 * listado de películas. Singleton: el término sobrevive a la navegación
 * (p. ej. al entrar al detalle y volver). Se pierde al recargar (F5).
 */
@Injectable({ providedIn: 'root' })
export class MovieSearchService {
  private subject = new BehaviorSubject<string>('');
  search$ = this.subject.asObservable();

  /** Estado del drawer de búsqueda avanzada (lo dispara el header). */
  filterOpen = signal(false);

  get value(): string {
    return this.subject.value;
  }

  set(term: string): void {
    this.subject.next(term);
  }

  clear(): void {
    this.subject.next('');
  }

  toggleFilter(): void {
    this.filterOpen.update(v => !v);
  }

  closeFilter(): void {
    this.filterOpen.set(false);
  }
}
