import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  Subject,
  BehaviorSubject,
  EMPTY,
} from 'rxjs';
import {
  switchMap,
  takeUntil,
  catchError,
  finalize,
  tap,
} from 'rxjs/operators';
import { RatingSkullsComponent } from '../rating-skulls/rating-skulls.component';
import { ReviewService } from '../../../services/review.service';
import { AuthService } from '../../../services/auth/auth.service';
import { ProfileService } from '../../../services/profile.service';
import { Review } from '../../../interfaces/review-interface';

@Component({
  selector: 'app-movie-reviews',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RatingSkullsComponent],
  templateUrl: './movie-reviews.component.html',
  styleUrls: ['./movie-reviews.component.css'],
})
export class MovieReviewsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) movieId!: number;

  // ── DI ──────────────────────────────────────────────────────────────────
  private fb = inject(FormBuilder);
  private reviewService = inject(ReviewService);
  readonly auth = inject(AuthService);
  protected profileService = inject(ProfileService);

  // ── Streams ──────────────────────────────────────────────────────────────
  private destroy$ = new Subject<void>();
  private reload$ = new BehaviorSubject<void>(undefined);

  // ── UI state ─────────────────────────────────────────────────────────────
  reviews = signal<Review[]>([]);
  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  submitError = signal<string | null>(null);
  submitSuccess = signal(false);
  deletingId = signal<number | null>(null);

  // Pagination
  page = signal(1);
  lastPage = signal(1);
  total = signal(0);
  readonly perPage = 6;

  // ── Computed ─────────────────────────────────────────────────────────────
  readonly canManage = computed(
    () => this.auth.isAdmin() || this.auth.canEdit()
  );
  readonly activeProfile = this.profileService.activeProfile;

  readonly alreadyReviewed = computed(() => {
    const pid = this.activeProfile()?.id;
    if (!pid) return false;
    return this.reviews().some(r => r.profileId === pid);
  });

  readonly canSubmit = computed(
    () =>
      this.auth.isAuthenticated() &&
      this.activeProfile() !== null &&
      !this.alreadyReviewed()
  );

  // ── Form ──────────────────────────────────────────────────────────────────
  form!: FormGroup;

  /** Índice de calavera en hover (1-5) */
  hoveredStar = signal(0);

  /** Array [1..5] para el selector de calaveras */
  readonly starsRange = Array.from({ length: 5 }, (_, i) => i + 1);

  /** Calavera actualmente seleccionada — signal propio, actualizado en selectRating */
  skullSelected = signal(0);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForm();
    this.subscribeToReviews();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  private buildForm(): void {
    this.form = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.maxLength(1000)]],
    });
  }

  private subscribeToReviews(): void {
    this.reload$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(() =>
          this.reviewService
            .findAll({ movieId: this.movieId, page: this.page(), perPage: this.perPage })
            .pipe(
              catchError(() => {
                this.error.set('No se pudieron cargar las reseñas.');
                return EMPTY;
              }),
              finalize(() => this.loading.set(false))
            )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(res => {
        this.reviews.set(res.data);
        this.total.set(res.meta.total);
        this.lastPage.set(res.meta.lastPage);
      });
  }

  private reload(): void {
    this.reload$.next();
  }

  // ── Public API (template) ─────────────────────────────────────────────────

  goToPage(p: number): void {
    if (p < 1 || p > this.lastPage()) return;
    this.page.set(p);
    this.reload();
  }

  selectRating(skull: number): void {
    this.form.get('rating')!.setValue(skull);
    this.skullSelected.set(skull);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.lastPage() }, (_, i) => i + 1);
  }

  ratingCtrl(): AbstractControl {
    return this.form.get('rating')!;
  }

  commentCtrl(): AbstractControl {
    return this.form.get('comment')!;
  }

  submit(): void {
    if (this.form.invalid || !this.canSubmit()) return;

    const profile = this.activeProfile();
    if (!profile) return;

    this.submitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);

    const dto = {
      profileId: profile.id,
      movieId: this.movieId,
      rating: this.form.value.rating,
      comment: this.form.value.comment || undefined,
    };

    console.log(dto)

    this.reviewService
      .create(dto)
      .pipe(
        catchError(err => {
          this.submitError.set(err?.error?.message ?? 'Error al enviar la reseña.');
          return EMPTY;
        }),
        finalize(() => this.submitting.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.submitSuccess.set(true);
        this.form.reset({ rating: 0, comment: '' });
        this.skullSelected.set(0);
        this.page.set(1);
        this.reload();
      });
  }

  delete(id: number): void {
    if (!this.canManage()) return;
    this.deletingId.set(id);

    this.reviewService
      .remove(id)
      .pipe(
        catchError(() => {
          this.error.set('Error al eliminar la reseña.');
          return EMPTY;
        }),
        finalize(() => this.deletingId.set(null)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.reload());
  }

  authorName(r: Review): string {
    return r.profile?.profileName ?? `Perfil #${r.profileId}`;
  }

  ratingClass(rating: number): string {
    const n = Number(rating);

    if (n >= 4) return 'rating-high';
    if (n >= 2.5) return 'rating-mid';

    return 'rating-low';
  }

  isOwnReview(r: Review): boolean {
    return r.profileId === this.activeProfile()?.id;
  }

  skullCount(rating: number): number {
    return Math.round(Number(rating));
  }
}