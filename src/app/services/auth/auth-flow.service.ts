import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ABSOLUTE_ROUTES } from '../../constants/app-routes';
import { LoginCredentials } from '../../models/login-credentials.model';
import { RegistrationCredentials } from '../../models/registration-credentials.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthFlowService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async signInAndRedirect(credentials: LoginCredentials): Promise<void> {
    await this.auth.signIn(credentials);
    await this.navigateToCurrentUserDashboard();
  }

  async registerAndRedirect(credentials: RegistrationCredentials): Promise<void> {
    await this.auth.register(credentials);
    await this.navigateToCurrentUserDashboard();
  }

  async signOutAndRedirect(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl(ABSOLUTE_ROUTES.login);
  }

  private async navigateToCurrentUserDashboard(): Promise<void> {
    const dashboardRoute = await firstValueFrom(
      this.auth.dashboardRouteForCurrentUser$(),
    );

    await this.router.navigateByUrl(dashboardRoute);
  }
}
