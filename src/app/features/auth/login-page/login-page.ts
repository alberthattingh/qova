import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';

import { ABSOLUTE_ROUTES } from '../../../constants/app-routes';
import { LoginCredentials } from '../../../models/login-credentials.model';
import { AuthFlowService } from '../../../services/auth/auth-flow.service';
import { NotificationService } from '../../../services/notifications/notification.service';
import { LoginForm } from '../login-form/login-form';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';

@Component({
  selector: 'app-login-page',
  imports: [
    CardModule,
    LoginForm,
    LoadingState,
    RouterLink,
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly authFlow = inject(AuthFlowService);
  private readonly notifications = inject(NotificationService);

  protected readonly registerRoute = ABSOLUTE_ROUTES.register;
  protected readonly isSubmitting = signal(false);

  async submit(credentials: LoginCredentials): Promise<void> {
    this.isSubmitting.set(true);

    try {
      await this.authFlow.signInAndRedirect(credentials);
    } catch {
      this.notifications.error(
        'Unable to sign in',
        'Check your email and password, then try again.',
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
