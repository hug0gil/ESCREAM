import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { ProfileService } from '../../../services/profile.service';
import { Profile } from '../../../interfaces/profile-interface';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-profiles-browser',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './profiles-browser.component.html',
  styleUrl: './profiles-browser.component.css',
})
export class ProfilesBrowserComponent {
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  protected profiles = signal<Profile[]>([]);
  protected loading = signal(true);
  protected errorMsg = signal<string | null>(null);
  protected showForm = signal(false);

  protected createForm!: FormGroup;

  ngOnInit(): void {
    const user = this.auth.currentUser();

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.createForm = this.fb.group({
      profileName: ['', [Validators.required, Validators.minLength(2)]],
      ageRestriction: [18, Validators.required],
    });

    this.profileService.getByUser$(user.id).subscribe({
      next: profiles => {
        this.profiles.set(profiles);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudieron cargar los perfiles.');
        this.loading.set(false);
      },
    });
  }

  protected get isDirty(): boolean {
    return this.createForm.dirty;
  }

  protected get canCreate(): boolean {
    return this.createForm.dirty && this.createForm.valid;
  }

  /** Inicial en mayúscula para el avatar */
  protected initial(profile: Profile): string {
    return profile.profileName.charAt(0).toUpperCase();
  }

  /** Selecciona el perfil y entra al catálogo */
  protected choose(profile: Profile): void {
    this.profileService.selectProfile(profile);
    this.router.navigate(['/movies']);
  }

  protected showCreateForm(): void {
    this.showForm.set(true);
  }

  protected cancelCreate(): void {
    this.showForm.set(false);

    this.createForm.reset({
      profileName: '',
      ageRestriction: 18,
    });
  }

  protected createProfile(): void {
    if (!this.canCreate) return;

    const user = this.auth.currentUser();
    if (!user) return;

    const { profileName, ageRestriction } = this.createForm.getRawValue();

    this.profileService.createProfile({ profileName, ageRestriction, userId: user.id }).subscribe({
      next: (created) => {
        this.profiles.update(profiles => [...profiles, created]) // Le añadimos al array de profiles el nuevo
        this.createForm.reset({ profileName: '', ageRestriction: 18 });
        this.showForm.set(false);
      },
      error: (err) => console.error('Error al crear perfil', err),
    });
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