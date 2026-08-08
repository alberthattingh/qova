import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { ABSOLUTE_ROUTES } from '../../../constants/app-routes';
import { AuthService } from '../../../services/auth/auth.service';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';

@Component({
  selector: 'app-register-page',
  imports: [
    ButtonModule,
    CardModule,
    ErrorState,
    InputTextModule,
    LoadingState,
    PasswordModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly loginRoute = ABSOLUTE_ROUTES.login;
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    try {
      const { email, password } = this.form.getRawValue();
      await this.authService.register(email, password);
      const dashboardRoute = await firstValueFrom(
        this.authService.dashboardRouteForCurrentUser$(),
      );
      await this.router.navigateByUrl(dashboardRoute);
    } catch {
      this.errorMessage.set('We could not create that account. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
