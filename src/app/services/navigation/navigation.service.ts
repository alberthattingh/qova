import { Injectable } from '@angular/core';

import { ABSOLUTE_ROUTES } from '../../constants/app-routes';
import { NavItem } from '../../models/nav-item.model';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  readonly authenticatedNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      route: ABSOLUTE_ROUTES.userDashboard,
    },
    {
      label: 'Commitments',
      icon: 'pi pi-list-check',
      route: ABSOLUTE_ROUTES.commitments,
    },
    {
      label: 'Managers',
      icon: 'pi pi-users',
      route: ABSOLUTE_ROUTES.managers,
    },
    {
      label: 'Check-ins',
      icon: 'pi pi-calendar-clock',
      route: ABSOLUTE_ROUTES.checkIns,
    },
    {
      label: 'Review queue',
      icon: 'pi pi-inbox',
      route: ABSOLUTE_ROUTES.reviewQueue,
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      route: ABSOLUTE_ROUTES.settings,
    },
  ];
}
