import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { ABSOLUTE_ROUTES } from '../../constants/app-routes';
import { AuthService } from '../../services/auth/auth.service';
import { AuthFlowService } from '../../services/auth/auth-flow.service';
import { NavigationLoadingService } from '../../services/navigation/navigation-loading.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { LoadingState } from '../../shared/components/loading-state/loading-state';

@Component({
  selector: 'app-authenticated-layout',
  imports: [
    AsyncPipe,
    ButtonModule,
    LoadingState,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './authenticated-layout.html',
  styleUrl: './authenticated-layout.scss',
})
export class AuthenticatedLayout {
  private readonly authFlow = inject(AuthFlowService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly currentUser$ = this.authService.currentUser$;
  protected readonly isRouteLoading$ = inject(NavigationLoadingService).isLoading$;
  protected readonly navItems = inject(NavigationService).authenticatedNavItems;
  protected readonly ABSOLUTE_ROUTES = ABSOLUTE_ROUTES;

  constructor() {
    this.authService.currentAuthSession$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((session) => {
      if (!session) {
        void this.router.navigateByUrl(ABSOLUTE_ROUTES.login);
      }
    });
  }

  async signOut(): Promise<void> {
    await this.authFlow.signOutAndRedirect();
  }
}
