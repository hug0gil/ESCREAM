// dashboard.component.ts
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth/auth.service';
import { ProfileService } from '../../services/profile.service';
import { FormGroup, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlanService } from '../../services/plan.service';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  protected auth = inject(AuthService);
  private plansService = inject(PlanService);
  protected profileService = inject(ProfileService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  protected saveToast = signal(false);
  protected deleteToast = signal(false);

  protected form!: FormGroup;

  ngOnInit(): void {
    const profile = this.profileService.activeProfile();
    const user = this.auth.currentUser();

    this.form = this.fb.group({
      profileName: [
        profile?.profileName.trim() ?? '',
        [Validators.required, Validators.minLength(2)],
      ],
      email: [
        user?.email.trim() ?? '',
        [Validators.required, Validators.email],
      ],
      ageRestriction: [
        profile?.ageRestriction ?? '',
        [Validators.required]
      ]
    });
  }

  protected get isDirty(): boolean {
    return this.form.dirty;
  }

  protected get canSave(): boolean {
    return this.form.dirty && this.form.valid;
  }

  protected saveChanges(): void {
    if (!this.canSave) return;

    const profileId = this.profileService.activeProfile()?.id;
    if (!profileId) return;

    const user = this.auth.currentUser();
    if (!user) return;

    const { profileName, ageRestriction, email } = this.form.getRawValue();
    const cleanEmail = email.trim();
    const updateUser$ = cleanEmail !== user.email
      ? this.auth.updateCurrentUser({ email: cleanEmail })
      : of(user);

    forkJoin({
      profile: this.profileService.updateProfile(profileId, { profileName, ageRestriction }),
      user: updateUser$,
    }).subscribe({
      next: ({ profile, user }) => {
        this.form.patchValue({
          profileName: profile.profileName,
          ageRestriction: profile.ageRestriction,
          email: user.email,
        }, { emitEvent: false });
        this.form.markAsPristine();
        this.saveToast.set(true);
        this.profileService.selectProfile(profile);
      },
      error: (err) => console.error('Error al actualizar datos', err),
    });
  }

  // ✅ toSignal se suscribe a getPlans$(), shareReplay evita petición duplicada
  private plans = toSignal(this.plansService.getPlans$());

  protected planName = computed(() => {
    const id = this.auth.currentUser()?.planId;
    return this.plans()?.find(p => p.id === id)?.name ?? '—';
  });

  deleteProfile(): void {
    const profileId = this.profileService.activeProfile()?.id;
    if (!profileId) return;

    this.profileService.deleteProfile(profileId).subscribe({
      next: () => {
        this.profileService.clearProfile();
        this.router.navigate(['/profiles'])
        this.deleteToast.set(true);
      },
      error: (err) => { console.error('Error al actualizar perfil', err) },
    });
  }
}
