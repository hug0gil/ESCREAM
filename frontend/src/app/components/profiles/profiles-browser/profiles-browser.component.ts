import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { ProfileService } from '../../../services/profile/profile.service';
import { Profile } from '../../../interfaces/profile-interface';

@Component({
  selector: 'app-profiles-browser',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './profiles-browser.component.html',
  styleUrl: './profiles-browser.component.css',
})
export class ProfilesBrowserComponent {
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  protected profiles = signal<Profile[]>([]);
  protected loading = signal(true);
  protected errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

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

  /** Inicial en mayúscula para el avatar. */
  initial(profile: Profile): string {
    return profile.profileName.charAt(0).toUpperCase();
  }

  /** Selecciona el perfil y entra al catálogo. */
  choose(profile: Profile): void {
    this.profileService.selectProfile(profile);
    this.router.navigate(['/movies']);
  }
}
