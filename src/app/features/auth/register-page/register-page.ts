import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';

import { ABSOLUTE_ROUTES } from '../../../constants/app-routes';
import { RegistrationCredentials } from '../../../models/registration-credentials.model';
import { AuthFlowService } from '../../../services/auth/auth-flow.service';
import { NotificationService } from '../../../services/notifications/notification.service';
import { RegisterForm } from '../register-form/register-form';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';

@Component({
  selector: 'app-register-page',
  imports: [
    CardModule,
    LoadingState,
    RegisterForm,
    RouterLink,
  ],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
})
export class RegisterPage {
  private readonly authFlow = inject(AuthFlowService);
  private readonly notifications = inject(NotificationService);

  protected readonly loginRoute = ABSOLUTE_ROUTES.login;
  protected readonly isSubmitting = signal(false);

  async submit(credentials: RegistrationCredentials): Promise<void> {
    this.isSubmitting.set(true);

    try {
      await this.authFlow.registerAndRedirect(credentials);
      this.notifications.success('Account created', 'Welcome to Qova.');
    } catch (error) {
      this.notifications.error(
        'Unable to register',
        error instanceof Error
          ? error.message
          : 'We could not create that account. Please try again.',
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
