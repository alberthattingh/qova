import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { ABSOLUTE_ROUTES } from '../../constants/app-routes';
import { UserRole } from '../../constants/user-roles';
import { AuthService } from '../../services/auth/auth.service';
import { DashboardRoutingService } from '../../services/navigation/dashboard-routing.service';
import { NavigationService } from '../../services/navigation/navigation.service';

@Component({
  selector: 'app-authenticated-layout',
  imports: [AsyncPipe, ButtonModule, RouterLink, RouterLinkActive, RouterOutlet, TagModule],
  templateUrl: './authenticated-layout.html',
  styleUrl: './authenticated-layout.scss',
})
export class AuthenticatedLayout {
  private readonly authService = inject(AuthService);
  private readonly dashboardRouting = inject(DashboardRoutingService);
  private readonly router = inject(Router);

  protected readonly currentUser$ = this.authService.currentUser$;
  protected readonly navItems = inject(NavigationService).authenticatedNavItems;
  protected readonly ABSOLUTE_ROUTES = ABSOLUTE_ROUTES;

  async signOut(): Promise<void> {
    await this.authService.signOut();
    await this.router.navigateByUrl(ABSOLUTE_ROUTES.login);
  }

  dashboardRouteForUser(role: UserRole): string {
    return this.dashboardRouting.dashboardForRole(role);
  }
}
