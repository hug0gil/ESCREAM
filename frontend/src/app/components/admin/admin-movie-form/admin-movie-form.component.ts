import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { DirectorService } from '../../../services/director.service';
import { ProductionCompanyService } from '../../../services/production-company.service';
import { ActorService } from '../../../services/actor.service';
import { SubgenreService } from '../../../services/subgenre.service';
import { MovieService } from '../../../services/movie/movie.service';
import { RatingSkullsComponent } from '../../movies/rating-skulls/rating-skulls.component';

interface NamedEntity { id: number; name: string; }
interface SubgenreOption { id: number; name: string; slug?: string; }

@Component({
  selector: 'app-movie-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, RatingSkullsComponent],
  templateUrl: './admin-movie-form.component.html',
  styleUrls: ['./admin-movie-form.component.css'],
})
export class AdminMovieFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private directorService = inject(DirectorService);
  private companyService = inject(ProductionCompanyService);
  private actorService = inject(ActorService);
  private subgenreService = inject(SubgenreService);
  private movieService = inject(MovieService);

  isEdit = signal(false);
  movieId = signal<number | null>(null);
  fetching = signal(false);
  serverError = signal<string | null>(null);

  directors = signal<NamedEntity[]>([]);
  companies = signal<NamedEntity[]>([]);
  actors = signal<NamedEntity[]>([]);
  subgenres = signal<SubgenreOption[]>([]);

  countries: string[] = [];

  selectedActorIds = signal<number[]>([]);
  selectedSubgenreIds = signal<number[]>([]);
  countryOpen = false;

  // ── Calaveras ─────────────────────────────────────────────
  hoverRating = 0;

  get currentRating(): number {
    return Number(this.form?.get('rating')?.value ?? 0);
  }

  setRating(r: number) {
    const current = this.currentRating;
    this.form.get('rating')!.setValue(current === r ? null : r);
  }

  form!: FormGroup;

  ngOnInit() {
    this.buildForm();
    this.loadLookups();
    this.loadCountries();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.movieId.set(+id);
      this.loadMovie(+id);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      synopsis: [''],
      country: ['', [Validators.required, Validators.maxLength(255)]],
      year: [null, [Validators.min(1800), Validators.max(2100)]],
      rating: [null, [Validators.min(1), Validators.max(5)]],
      image: ['', Validators.maxLength(2048)],
      movieUrl: ['', Validators.maxLength(2048)],
      directorId: ['', Validators.required],
      productionCompanyId: ['', Validators.required],
    });
  }

  private loadCountries() {
    this.movieService.getFacets()
      .pipe(takeUntil(this.destroy$))
      .subscribe(facets => {
        this.countries = this.mergeCurrentCountry(facets.countries);
      });
  }

  private loadLookups() {
    forkJoin({
      directors: this.directorService.getAllDirectors(),
      companies: this.companyService.getAllCompanies(),
      actors: this.actorService.getAllActors(),
      subgenres: this.subgenreService.getAllSubgenres(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ directors, companies, actors, subgenres }) => {
        this.directors.set(directors);
        this.companies.set(companies);
        this.actors.set(actors);
        this.subgenres.set(subgenres);
      });
  }

  private loadMovie(id: number) {
    this.fetching.set(true);

    this.movieService.getMovieById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(movie => {
        this.form.patchValue({
          title: movie.title,
          synopsis: movie.synopsis,
          country: movie.country,
          year: movie.year,
          rating: movie.rating ? Number(movie.rating) : null,
          image: movie.image,
          movieUrl: movie.movieUrl,
          directorId: movie.directorId ?? movie.director?.id,
          productionCompanyId: movie.productionCompanyId ?? movie.productionCompany?.id,
        });
        this.countries = this.mergeCurrentCountry(this.countries);

        this.selectedActorIds.set(
          movie.actors?.map((a: any) => a.actor?.id ?? a.id) ?? []
        );
        this.selectedSubgenreIds.set(
          movie.subgenres?.map((s: any) => s.subgenre?.id ?? s.id) ?? []
        );

        this.fetching.set(false);
      });
  }

  // ── País ──────────────────────────────────────────────────
  selectCountry(code: string) {
    const countryCtrl = this.form.get('country')!;
    const current = countryCtrl.value;
    countryCtrl.setValue(current === code ? '' : code);
    countryCtrl.markAsDirty();
    countryCtrl.markAsTouched();
  }

  isCountrySelected(code: string): boolean {
    return this.form.get('country')!.value === code;
  }

  private mergeCurrentCountry(countries: string[]): string[] {
    const currentCountry = this.form?.get('country')?.value;
    if (currentCountry && !countries.includes(currentCountry)) {
      return [currentCountry, ...countries];
    }
    return countries;
  }

  fieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return Boolean(field?.invalid && field.touched);
  }

  // ── Actores ───────────────────────────────────────────────
  toggleActor(id: number) {
    this.selectedActorIds.update(list =>
      list.includes(id) ? list.filter(x => x !== id) : [...list, id]
    );
  }

  isActorSelected(id: number): boolean {
    return this.selectedActorIds().includes(id);
  }

  // ── Subgéneros ────────────────────────────────────────────
  toggleSubgenre(id: number) {
    this.selectedSubgenreIds.update(list =>
      list.includes(id) ? list.filter(x => x !== id) : [...list, id]
    );
  }

  isSubgenreSelected(id: number): boolean {
    return this.selectedSubgenreIds().includes(id);
  }

  // ── Submit ────────────────────────────────────────────────
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const payload = {
      ...raw,
      directorId: +raw.directorId,
      productionCompanyId: +raw.productionCompanyId,
      actorIds: this.selectedActorIds(),
      subgenreIds: this.selectedSubgenreIds(),
    };

    const req = this.isEdit()
      ? this.movieService.updateMovie(this.movieId()!, payload)
      : this.movieService.createMovie(payload);

    req.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.router.navigate(['/admin-dashboard/movies']),
      error: (err) => {
        console.error(err);
        this.serverError.set('Error al guardar la película');
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin-dashboard/movies']);
  }
}
