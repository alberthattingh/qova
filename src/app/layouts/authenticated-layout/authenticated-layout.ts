import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { ABSOLUTE_ROUTES } from '../../constants/app-routes';
import { AuthService } from '../../services/auth/auth.service';
import { AuthFlowService } from '../../services/auth/auth-flow.service';
import { NavigationService } from '../../services/navigation/navigation.service';

@Component({
  selector: 'app-authenticated-layout',
  imports: [AsyncPipe, ButtonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './authenticated-layout.html',
  styleUrl: './authenticated-layout.scss',
})
export class AuthenticatedLayout {
  private readonly authFlow = inject(AuthFlowService);
  private readonly authService = inject(AuthService);

  protected readonly currentUser$ = this.authService.currentUser$;
  protected readonly navItems = inject(NavigationService).authenticatedNavItems;
  protected readonly ABSOLUTE_ROUTES = ABSOLUTE_ROUTES;

  async signOut(): Promise<void> {
    await this.authFlow.signOutAndRedirect();
  }
}
