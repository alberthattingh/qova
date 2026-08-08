import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';

import { AuthService } from '../services/auth/auth.service';
import { DashboardRoutingService } from '../services/navigation/dashboard-routing.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const dashboardRouting = inject(DashboardRoutingService);
  const router = inject(Router);

  if (authService.hasAuthenticatedSession()) {
    return router.createUrlTree([dashboardRouting.defaultDashboard()]);
  }

  return authService.currentAuthSession$.pipe(
    take(1),
    map((session) =>
      session
        ? router.createUrlTree([dashboardRouting.defaultDashboard()])
        : true,
    ),
  );
};
