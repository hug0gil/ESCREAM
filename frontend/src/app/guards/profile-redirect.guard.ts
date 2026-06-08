import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { ProfileService } from '../services/profile.service';

export const profileRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const profileService = inject(ProfileService);
  const router = inject(Router);

  // Tiene usuario pero no ha seleccionado perfil → redirige a profiles
  if (auth.getCurrentUser() && !profileService.activeProfile()) {
    return router.createUrlTree(['/profiles']);
  }

  return true;
};