import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { MoviesFilter } from '../../../interfaces/movie-filters';
import { MovieService } from '../../../services/movie/movie.service';

@Component({
  selector: 'app-movies-filter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxSliderModule],
  templateUrl: './movies-filter.component.html',
  styleUrls: ['./movies-filter.component.css']
})
export class MoviesFilterComponent {
  private fb = new FormBuilder();
  private moviesService = inject(MovieService);

  @Input() subgenres: string[] = [];
  @Input() ratings: number[] = [1, 2, 3, 4, 5];
  @Input() countries: string[] = [];
  @Input() yearRangeLimits: { min: number; max: number } = { min: 1900, max: new Date().getFullYear() };
  @Input() showContent = false;

  @Output() filtersChange = new EventEmitter<MoviesFilter>();
  @Output() close = new EventEmitter<void>();

  form: FormGroup = this.fb.group({
    search: [''],
    subgenres: this.fb.array([]),
    rating: this.fb.array([]),
    countries: this.fb.array([]),
    yearRange: this.fb.group({
      min: [this.yearRangeLimits.min],
      max: [this.yearRangeLimits.max]
    })
  });

  // Estado de los dropdowns
  public dropdownOpen: { [key: string]: boolean } = {
    subgenres: false,
    rating: false,
    countries: false,
    year: false
  };

  // Función para alternar cada dropdown
  toggleDropdown(name: string) {
    this.dropdownOpen[name] = !this.dropdownOpen[name];
  }


  // ========================
  // HELPERS PARA FORMARRAY
  // ========================
  get subgenresArray() {
    return this.form.get('subgenres') as FormArray;
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

    // Emitimos para que el padre sepa los filtros actuales
    this.filtersChange.emit(filters);

    // Llamamos al servicio y nos subscribimos
    this.moviesService.filterMovies(filters).subscribe({
      next: movies => {
        console.log('Películas filtradas:', movies);
        // opcional: actualizar un array local si quieres mostrar en la lista directamente
      },
      error: err => console.error('Error al filtrar películas:', err)
    });
  }


  reset() {
    this.subgenresArray.clear();
    this.ratingArray.clear();
    this.countriesArray.clear();

    this.form.reset({
      search: '',
      yearRange: { ...this.yearRangeLimits }
    });

    this.filtersChange.emit(this.form.value);
  }

}
