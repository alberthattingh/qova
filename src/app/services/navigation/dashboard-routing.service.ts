import { Injectable } from '@angular/core';

import { ABSOLUTE_ROUTES } from '../../constants/app-routes';

@Injectable({
  providedIn: 'root',
})
export class DashboardRoutingService {
  defaultDashboard(): string {
    return ABSOLUTE_ROUTES.userDashboard;
  }
}
