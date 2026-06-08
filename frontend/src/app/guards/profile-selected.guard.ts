import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ProfileService } from '../services/profile.service';

export const profileSelectedGuard: CanActivateFn = () => {

  const profileService = inject(ProfileService);
  const router = inject(Router);

  if (profileService.activeProfile()) {
    console.log(profileService.activeProfile())
    return true;
  }
  return router.createUrlTree(['/profiles']);
};
