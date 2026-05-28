import { Component, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { MoviesFilter } from '../../../interfaces/movie-filters';
import { Subgenre } from '../../../interfaces/subgenre-interface';

@Component({
  selector: 'app-movies-filter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxSliderModule],
  templateUrl: './movies-filter.component.html',
  styleUrls: ['./movies-filter.component.css']
})
export class MoviesFilterComponent implements OnInit {
  private fb = new FormBuilder();

  // ========================
  // INPUTS (signals)
  // ========================
  subgenres = input<Subgenre[]>([]);
  ratings = input<number[]>([1, 2, 3, 4, 5]);
  countries = input<string[]>([]);
  yearRangeLimits = input<{ min: number; max: number }>({
    min: 1900,
    max: new Date().getFullYear(),
  });
  // Filtros con los que precargar el formulario (al volver del detalle).
  initialFilters = input<MoviesFilter | null>(null);

  // ========================
  // OUTPUTS (signals)
  // ========================
  filtersChange = output<MoviesFilter>();
  close = output<void>();

  form: FormGroup = this.fb.group({
    subgenreIds: this.fb.array([]),
    rating: this.fb.array([]),
    countries: this.fb.array([]),
    yearRange: this.fb.group({
      min: [this.yearRangeLimits().min],
      max: [this.yearRangeLimits().max]
    })
  });

  // Estado de los dropdowns
  public dropdownOpen: { [key: string]: boolean } = {
    subgenres: false,
    rating: false,
    countries: false,
    year: false
  };

  ngOnInit() {
    // Si volvemos del detalle con filtros guardados, precargamos el formulario
    // (sin emitir: la lista ya se restaura en el padre).
    const f = this.initialFilters();
    if (f) this.applyFilters(f);
  }

  /** Rellena el formulario a partir de unos filtros guardados. */
  private applyFilters(f: MoviesFilter) {
    this.subgenreIdsArray.clear();
    this.ratingArray.clear();
    this.countriesArray.clear();

    (f.subgenreIds ?? []).forEach(id => this.subgenreIdsArray.push(this.fb.control(id)));
    (f.rating ?? []).forEach(r => this.ratingArray.push(this.fb.control(r)));
    (f.countries ?? []).forEach(c => this.countriesArray.push(this.fb.control(c)));

    this.form.patchValue({
      yearRange: {
        min: f.yearRange?.min ?? this.yearRangeLimits().min,
        max: f.yearRange?.max ?? this.yearRangeLimits().max,
      },
    });
  }

  // Función para alternar cada dropdown
  toggleDropdown(name: string) {
    this.dropdownOpen[name] = !this.dropdownOpen[name];
  }


  // ========================
  // HELPERS PARA FORMARRAY
  // ========================

  get subgenreIdsArray() {
    return this.form.get('subgenreIds') as FormArray;
  }

  get ratingArray() {
    return this.form.get('rating') as FormArray;
  }

  get countriesArray() {
    return this.form.get('countries') as FormArray;
  }

  toggleCheckbox(value: string | number, array: FormArray) {
    const index = array.controls.findIndex(ctrl => ctrl.value === value);
    if (index === -1) {
      array.push(this.fb.control(value));
    } else {
      array.removeAt(index);
    }
  }

  // ========================
  // SUBMIT / RESET
  // ========================
  submit() {
    const filters: MoviesFilter = this.form.value;
    this.filtersChange.emit(filters);
  }


  reset() {
    this.subgenreIdsArray.clear();
    this.ratingArray.clear();
    this.countriesArray.clear();

    this.form.reset({
      yearRange: { ...this.yearRangeLimits() }
    });

    this.submit();
  }



}
