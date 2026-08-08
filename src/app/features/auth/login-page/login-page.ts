import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';

import { ABSOLUTE_ROUTES } from '../../../constants/app-routes';
import { LoginCredentials } from '../../../models/login-credentials.model';
import { AuthFlowService } from '../../../services/auth/auth-flow.service';
import { LoginForm } from '../login-form/login-form';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';

@Component({
  selector: 'app-login-page',
  imports: [
    CardModule,
    ErrorState,
    LoginForm,
    LoadingState,
    RouterLink,
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly authFlow = inject(AuthFlowService);

  protected readonly registerRoute = ABSOLUTE_ROUTES.register;
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  async submit(credentials: LoginCredentials): Promise<void> {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.authFlow.signInAndRedirect(credentials);
    } catch {
      this.errorMessage.set('Check your email and password, then try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
