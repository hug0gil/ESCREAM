// dashboard.component.ts
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { PlanService } from '../../services/plan.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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
  protected emailChangeMsg = signal<string | null>(null);
  protected emailChangeError = signal<string | null>(null);
  protected emailChangeLoading = signal(false);

  protected form!: FormGroup;
  protected emailChangeForm!: FormGroup;

  ngOnInit(): void {
    const profile = this.profileService.activeProfile();
    const user = this.auth.currentUser();

    this.form = this.fb.group({
      profileName: [
        profile?.profileName.trim() ?? '',
        [Validators.required, Validators.minLength(2)],
      ],
      ageRestriction: [profile?.ageRestriction ?? '', [Validators.required]],
    });

    this.emailChangeForm = this.fb.group({
      newEmail: [
        user?.email.trim() ?? '',
        [Validators.required, Validators.email],
      ],
      currentPassword: [
        '',
        [Validators.required, Validators.minLength(8)],
      ],
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

    const { profileName, ageRestriction } = this.form.getRawValue();

    this.profileService
      .updateProfile(profileId, { profileName, ageRestriction })
      .subscribe({
        next: profile => {
          this.form.patchValue(
            {
              profileName: profile.profileName,
              ageRestriction: profile.ageRestriction,
            },
            { emitEvent: false },
          );
          this.form.markAsPristine();
          this.saveToast.set(true);
          this.profileService.selectProfile(profile);
        },
        error: err => console.error('Error al actualizar datos', err),
      });
  }

  protected requestEmailChange(): void {
    this.emailChangeMsg.set(null);
    this.emailChangeError.set(null);
    if (this.emailChangeForm.invalid) {
      this.emailChangeForm.markAllAsTouched();
      return;
    }

    const currentEmail = this.auth.currentUser()?.email;
    const { newEmail, currentPassword } = this.emailChangeForm.getRawValue();
    if (newEmail.trim() === currentEmail) {
      this.emailChangeError.set('Introduce un correo diferente al actual.');
      return;
    }

    this.emailChangeLoading.set(true);
    this.auth
      .requestEmailChange({
        newEmail: newEmail.trim(),
        currentPassword,
      })
      .subscribe({
        next: () => {
          this.emailChangeLoading.set(false);
          this.emailChangeMsg.set(
            'Revisa tu nuevo correo para confirmar el cambio.',
          );
          this.emailChangeForm.patchValue({ currentPassword: '' });
          this.emailChangeForm.markAsPristine();
          // this.auth.logout();
        },
        error: err => {
          this.emailChangeLoading.set(false);
          this.emailChangeError.set(
            err.status === 409
              ? 'Ese correo ya está en uso.'
              : err.status === 401
                ? 'La contraseña actual no es correcta.'
                : 'No se pudo solicitar el cambio de correo.',
          );
        },
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
        this.router.navigate(['/profiles']);
        this.deleteToast.set(true);
      },
      error: err => {
        console.error('Error al actualizar perfil', err);
      },
    });
  }
}
