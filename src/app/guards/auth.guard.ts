import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';

import { ABSOLUTE_ROUTES } from '../constants/app-routes';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = () => {
  return canActivateAuthenticatedRoute();
};

export const authChildGuard: CanActivateChildFn = () => {
  return canActivateAuthenticatedRoute();
};

function canActivateAuthenticatedRoute() {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) =>
      isAuthenticated ? true : router.createUrlTree([ABSOLUTE_ROUTES.login]),
    ),
  );
}
