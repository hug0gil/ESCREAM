import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { AdminCrudService } from '../../../../services/admin-crud.service';
import { MovieService } from '../../../../services/movie/movie.service';
import { AdminCrudConfig, AdminField } from '../admin-crud.config';
import { RatingSkullsComponent } from '../../../movies/rating-skulls/rating-skulls.component';

@Component({
  selector: 'app-admin-crud-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RatingSkullsComponent],
  templateUrl: './admin-crud-form.component.html',
  styleUrl: './admin-crud-form.component.css',
})
export class AdminCrudFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminCrud = inject(AdminCrudService);
  private movieService = inject(MovieService);
  private destroy$ = new Subject<void>();

  // La ruta decide qué recurso estamos editando. El mismo componente sirve para
  // movies, actors, reviews, etc. porque recibe su contrato en `data.adminCrud`.
  protected config = this.route.snapshot.data['adminCrud'] as AdminCrudConfig;
  protected form = this.fb.group({});
  protected isEdit = signal(false);
  protected loading = signal(false);
  protected saving = signal(false);
  protected serverError = signal<string | null>(null);
  protected options = signal<Record<string, any[]>>({});
  protected countries = signal<string[]>([]);
  protected countryOpen = signal<Record<string, boolean>>({});
  protected hoveredRating = signal<Record<string, number>>({});

  private itemId: number | null = null;

  ngOnInit() {
    // Si existe `:id` en la ruta estamos editando; si no, creamos. Esta señal
    // también afecta a campos `createOnly` y required opcionales al editar.
    this.itemId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEdit.set(Number.isFinite(this.itemId) && this.itemId > 0);

    // El orden importa: primero se crea el FormGroup con la config, luego se
    // cargan opciones auxiliares, y finalmente se parchea el item si es edición.
    this.buildForm();
    this.loadOptions();
    this.loadCountries();

    if (this.isEdit()) {
      this.loadItem(this.itemId!);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected visibleFields(): AdminField[] {
    // Algunos campos solo tienen sentido al crear. Ejemplo típico: una contraseña
    // obligatoria al crear usuario, pero opcional o escondida al editar.
    return this.config.fields.filter(field => !field.createOnly || !this.isEdit());
  }

  protected control(field: AdminField): FormControl {
    return this.form.get(field.key) as FormControl;
  }

  protected optionLabel(option: any, field: AdminField): string {
    // `labelKey` puede ser una ruta anidada, por eso usamos `resolveValue`.
    // Si no existe, caemos a nombres comunes para hacer la config menos frágil.
    const labelKey = field.optionSource?.labelKey;
    return String((labelKey ? this.resolveValue(option, labelKey) : null) ?? option.name ?? option.title ?? option.id);
  }

  protected fieldOptions(field: AdminField): any[] {
    return this.options()[field.key] ?? [];
  }

  protected countryOptions(field: AdminField): string[] {
    // Al editar, el valor guardado puede no venir en facets. Lo insertamos al
    // principio para que el usuario vea y conserve el país actual.
    const current = this.control(field).value;
    const countries = this.countries();
    if (current && !countries.includes(current)) return [current, ...countries];
    return countries;
  }

  protected toggleCountryField(field: AdminField) {
    this.countryOpen.update(open => ({
      ...open,
      [field.key]: !open[field.key],
    }));
  }

  protected isCountryOpen(field: AdminField): boolean {
    return Boolean(this.countryOpen()[field.key]);
  }

  protected selectCountry(field: AdminField, code: string) {
    const control = this.control(field);
    control.setValue(control.value === code ? '' : code);
    control.markAsTouched();
    control.markAsDirty();
  }

  protected isCountrySelected(field: AdminField, code: string): boolean {
    return this.control(field).value === code;
  }

  protected toggleMultiValue(field: AdminField, id: number) {
    // Los multiselect se guardan como arrays de IDs porque eso es lo que esperan
    // los DTOs (`actorIds`, `subgenreIds`). La UI solo alterna chips.
    const control = this.control(field);
    const current = this.asNumberArray(control.value);
    control.setValue(current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
    control.markAsTouched();
    control.markAsDirty();
  }

  protected isMultiValueSelected(field: AdminField, id: number): boolean {
    return this.asNumberArray(this.control(field).value).includes(id);
  }

  protected currentRating(field: AdminField): number {
    return Number(this.control(field).value ?? 0);
  }

  protected hoverRating(field: AdminField): number {
    return this.hoveredRating()[field.key] ?? 0;
  }

  protected setHoveredRating(field: AdminField, rating: number) {
    this.hoveredRating.update(values => ({
      ...values,
      [field.key]: rating,
    }));
  }

  protected setRating(field: AdminField, rating: number) {
    const control = this.control(field);
    control.setValue(Number(control.value) === rating ? null : rating);
    control.markAsTouched();
    control.markAsDirty();
  }

  protected goBack() {
    this.router.navigate(['/admin-dashboard', this.config.routePath]);
  }

  protected onSubmit() {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.serverError.set(null);

    // La config describe la UI, pero el backend necesita un DTO limpio. Aquí se
    // normalizan tipos, se omiten opcionales vacíos y se convierte multiselect.
    const payload = this.buildPayload();
    const request = this.isEdit()
      ? this.adminCrud.update(this.config.resource, this.itemId!, payload)
      : this.adminCrud.create(this.config.resource, payload);

    request
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.goBack(),
        error: () => {
          this.saving.set(false);
          this.serverError.set(`No se pudo guardar ${this.config.singular}`);
        },
      });
  }

  private buildForm() {
    // Construye el FormGroup desde `AdminField[]`. Esto evita escribir un
    // formulario por recurso: los validadores salen de la misma config.
    for (const field of this.config.fields) {
      const validators = [];
      if (field.required && !(this.isEdit() && field.omitWhenEmpty)) {
        validators.push(Validators.required);
      }
      if (field.type === 'email') validators.push(Validators.email);
      if (field.min !== undefined) validators.push(Validators.min(field.min));
      if (field.max !== undefined) validators.push(Validators.max(field.max));
      if (field.minLength !== undefined) validators.push(Validators.minLength(field.minLength));
      if (field.maxLength !== undefined) validators.push(Validators.maxLength(field.maxLength));

      this.form.addControl(field.key, this.fb.control(this.defaultValue(field), validators));
    }
  }

  private loadOptions() {
    // Todos los campos con `optionSource` se cargan en paralelo. Así un recurso
    // como movies puede traer directores, productoras, actores y subgéneros a la vez.
    const optionFields = this.config.fields.filter(field => field.optionSource);
    if (optionFields.length === 0) return;

    const requests = Object.fromEntries(
      optionFields.map(field => [
        field.key,
        this.adminCrud.listAll(
          field.optionSource!.resource,
          field.optionSource!.perPage ?? 200,
        ),
      ]),
    );

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: values => this.options.set(values),
        error: () => this.serverError.set('No se pudieron cargar las opciones del formulario'),
      });
  }

  private loadCountries() {
    // `country` es especial porque no sale de un endpoint CRUD normal, sino de
    // facets de movies. Solo hacemos la llamada si la config usa ese tipo.
    if (!this.config.fields.some(field => field.type === 'country')) return;

    this.movieService.getFacets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: facets => this.countries.set(facets.countries),
        error: () => this.serverError.set('No se pudieron cargar los países'),
      });
  }

  private loadItem(id: number) {
    this.loading.set(true);

    this.adminCrud.getById(this.config.resource, id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: item => {
          this.patchItem(item);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.serverError.set(`No se pudo cargar ${this.config.singular}`);
        },
      });
  }

  private patchItem(item: any) {
    // Al editar, convertimos la respuesta del backend al shape del formulario.
    // Campos simples se copian; relaciones anidadas se resuelven en `valueForField`.
    const values: Record<string, any> = {};

    for (const field of this.config.fields) {
      const value = this.valueForField(item, field);
      if (value === undefined || value === null) continue;
      values[field.key] = field.type === 'date' ? this.toDateInputValue(value) : value;
    }

    this.form.patchValue(values);
  }

  private buildPayload(): Record<string, any> {
    // Parte crítica: el formulario contiene strings/arrays/booleans para la UI,
    // pero los DTOs esperan números reales y campos opcionales ausentes si están vacíos.
    const raw = this.form.getRawValue() as Record<string, any>;
    const payload: Record<string, any> = {};

    for (const field of this.config.fields) {
      if (field.createOnly && this.isEdit()) continue;

      const value = raw[field.key];
      if (field.omitWhenEmpty && Array.isArray(value) && value.length === 0) continue;
      if (field.omitWhenEmpty && (value === '' || value === null || value === undefined)) continue;

      if (field.type === 'number' || field.type === 'select' || field.type === 'rating') {
        payload[field.key] = value === '' || value === null ? null : Number(value);
      } else if (field.type === 'multiselect') {
        payload[field.key] = this.asNumberArray(value);
      } else if (field.type === 'checkbox') {
        payload[field.key] = Boolean(value);
      } else {
        payload[field.key] = value;
      }
    }

    return payload;
  }

  private defaultValue(field: AdminField): any {
    if (field.type === 'checkbox') return false;
    if (field.type === 'multiselect') return [];
    return '';
  }

  private valueForField(item: any, field: AdminField): any {
    // `relationArray` traduce relaciones tipo Prisma pivot:
    //   actors: [{ actor: { id: 1 } }]
    // a lo que el formulario y el DTO necesitan:
    //   actorIds: [1]
    if (field.relationArray) {
      const relationItems = this.resolveValue(item, field.relationArray.path) ?? [];
      if (!Array.isArray(relationItems)) return [];

      return relationItems
        .map(entry => {
          const nested = field.relationArray?.itemPath
            ? this.resolveValue(entry, field.relationArray.itemPath)
            : entry;
          return nested?.[field.relationArray?.idKey ?? 'id'];
        })
        .filter((value): value is number => typeof value === 'number');
    }

    if (field.valuePath) return this.resolveValue(item, field.valuePath);
    return this.resolveValue(item, field.key);
  }

  private asNumberArray(value: unknown): number[] {
    if (!Array.isArray(value)) return [];
    return value
      .map(item => Number(item))
      .filter(item => Number.isFinite(item));
  }

  private toDateInputValue(value: unknown): string {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toISOString().slice(0, 10);
  }

  private resolveValue(item: any, path: string): any {
    // Permite usar keys anidadas en config (`director.name`, `movie.title`)
    // sin hardcodear cada relación en los componentes genéricos.
    return path.split('.').reduce((value, key) => value?.[key], item);
  }
}
