import { Injectable } from '@angular/core';

import { ABSOLUTE_ROUTES } from '../../constants/app-routes';
import { UserRole } from '../../constants/user-roles';

@Injectable({
  providedIn: 'root',
})
export class DashboardRoutingService {
  dashboardForRole(role: UserRole): string {
    return role === UserRole.Manager
      ? ABSOLUTE_ROUTES.managerDashboard
      : ABSOLUTE_ROUTES.userDashboard;
  }
}
