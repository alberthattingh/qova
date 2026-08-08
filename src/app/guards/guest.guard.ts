import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';

import { AuthService } from '../services/auth/auth.service';
import { DashboardRoutingService } from '../services/navigation/dashboard-routing.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const dashboardRouting = inject(DashboardRoutingService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map((user) =>
      user
        ? router.createUrlTree([dashboardRouting.dashboardForRole(user.role)])
        : true,
    ),
  );
};
