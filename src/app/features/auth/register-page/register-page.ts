import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';

import { ABSOLUTE_ROUTES } from '../../../constants/app-routes';
import { RegistrationCredentials } from '../../../models/registration-credentials.model';
import { AuthFlowService } from '../../../services/auth/auth-flow.service';
import { RegisterForm } from '../register-form/register-form';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';

@Component({
  selector: 'app-register-page',
  imports: [
    CardModule,
    ErrorState,
    LoadingState,
    RegisterForm,
    RouterLink,
  ],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
})
export class RegisterPage {
  private readonly authFlow = inject(AuthFlowService);

  protected readonly loginRoute = ABSOLUTE_ROUTES.login;
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  async submit(credentials: RegistrationCredentials): Promise<void> {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.authFlow.registerAndRedirect(credentials);
    } catch {
      this.errorMessage.set('We could not create that account. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
