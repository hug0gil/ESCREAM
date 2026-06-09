import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs';
import { AdminCrudService } from '../../../../services/admin-crud.service';
import { AdminColumn, AdminCrudConfig } from '../admin-crud.config';
import { MovieService } from '../../../../services/movie/movie.service';
import { AuthService } from '../../../../services/auth/auth.service';

@Component({
  selector: 'app-admin-crud-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-crud-list.component.html',
  styleUrl: './admin-crud-list.component.css',
})
export class AdminCrudListComponent implements OnInit, OnDestroy {
  private adminCrud = inject(AdminCrudService);
  protected auth = inject(AuthService);
  private movieService = inject(MovieService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private searchInput$ = new Subject<string>();

  // Igual que el form: la ruta inyecta el contrato del recurso. Este componente
  // no sabe si lista movies, users o actors hasta leer `data.adminCrud`.
  protected config = this.route.snapshot.data['adminCrud'] as AdminCrudConfig;
  protected items = signal<any[]>([]);
  protected loading = signal(false);
  protected deleting = signal(false);
  protected seedingImages = signal(false);
  protected total = signal(0);
  protected lastPage = signal(1);
  protected currentPage = signal(1);
  protected itemToDelete = signal<any | null>(null);
  protected toast = signal<string | null>(null);

  protected searchTerm = '';
  protected perPage = 10;

  protected filteredItems = computed(() => {
    // El backend pagina, pero el buscador actual filtra sobre la página cargada.
    // Busca en todas las columnas configuradas, incluidas rutas anidadas.
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.items();

    return this.items().filter(item =>
      this.config.columns.some(column =>
        String(this.resolveValue(item, column.key) ?? '').toLowerCase().includes(term),
      ),
    );
  });

  protected visiblePages = computed(() => {
    // Ventana compacta de paginación: siempre muestra primera/última y alrededor
    // de la página actual, usando puntos suspensivos cuando hay muchas páginas.
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
    // Debounce para no recalcular el filtro en cada pulsación inmediata. Aquí no
    // llama al backend: solo actualiza el término usado por `filteredItems`.
    this.searchInput$
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => {
        this.searchTerm = value;
      });

    this.loadItems();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected loadItems() {
    // Todos los listados usan el mismo endpoint base: /api/<resource>.
    // `resource` viene de la config, así evitamos un servicio por cada tabla.
    this.loading.set(true);
    this.adminCrud.list(this.config.resource, this.currentPage(), this.perPage)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: res => {
          this.items.set(res.data);
          this.total.set(res.meta.total);
          this.lastPage.set(res.meta.lastPage);
        },
        error: () => this.showToast(`No se pudo cargar ${this.config.plural.toLowerCase()}`),
      });
  }

  protected onSearchChange(value: string) {
    this.searchInput$.next(value);
  }

  protected clearSearch() {
    this.searchTerm = '';
  }

  protected goToCreate() {
    this.router.navigate(['/admin-dashboard', this.config.routePath, 'new']);
  }

  protected seedImages() {
    // Acción extra solo para movies. La config activa el botón con `seedImages`
    // y la lista genérica sabe delegar al MovieService cuando corresponde.
    if (!this.config.seedImages || this.seedingImages()) return;

    this.seedingImages.set(true);
    this.movieService.seedMissingImages()
      .pipe(
        finalize(() => this.seedingImages.set(false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: res => {
          this.showToast(`Imágenes actualizadas: ${res.updated}/${res.processed}`);
          this.loadItems();
        },
        error: () => this.showToast('No se pudieron actualizar las imágenes'),
      });
  }

  protected goBack() {
    this.router.navigate(['/admin-dashboard']);
  }

  protected goToEdit(id: number) {
    this.router.navigate(['/admin-dashboard', this.config.routePath, id, 'edit']);
  }

  protected goToPage(page: number) {
    if (page < 1 || page > this.lastPage() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadItems();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected confirmDelete(item: any) {
    this.itemToDelete.set(item);
  }

  protected cancelDelete() {
    this.itemToDelete.set(null);
  }

  protected deleteItem() {
    // Borrado optimista moderado: esperamos confirmación del backend y recargamos
    // la página actual para mantener total, paginación y tabla sincronizados.
    const item = this.itemToDelete();
    if (!item) return;

    this.deleting.set(true);
    this.adminCrud.delete(this.config.resource, item.id)
      .pipe(
        finalize(() => this.deleting.set(false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => {
          this.itemToDelete.set(null);
          this.showToast(`Elemento de '${this.config.plural}' eliminado`);
          this.loadItems();
        },
        error: () => this.showToast(`No se pudo eliminar el elemento de '${this.config.plural}'`),
      });
  }

  protected displayValue(item: any, column: AdminColumn): string {
    // Centraliza cómo se pinta cada celda. La plantilla puede pedir el valor
    // sin saber si es fecha, booleano o una ruta anidada.
    const value = this.resolveValue(item, column.key);
    if (value === null || value === undefined || value === '') return '-';

    if (column.type === 'date') return this.formatDate(value);
    if (column.type === 'boolean') return value ? 'Sí' : 'No';
    return String(value);
  }

  protected deleteLabel(item: any): string {
    return String(this.resolveValue(item, this.config.deleteLabelKey) ?? `#${item.id}`);
  }

  protected resolveValue(item: any, path: string): any {
    // Soporta columnas configuradas como `director.name` o `profile.profileName`.
    return path.split('.').reduce((value, key) => value?.[key], item);
  }

  private formatDate(value: unknown): string {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('es-ES').format(date);
  }

  private showToast(message: string) {
    this.toast.set(message);
    setTimeout(() => this.toast.set(null), 3000);
  }
}
