import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { ABSOLUTE_ROUTES } from '../../../constants/app-routes';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-login-page',
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
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly registerRoute = ABSOLUTE_ROUTES.register;
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
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
      await this.authService.signIn(email, password);
      const dashboardRoute = await firstValueFrom(
        this.authService.dashboardRouteForCurrentUser$(),
      );
      await this.router.navigateByUrl(dashboardRoute);
    } catch {
      this.errorMessage.set('Check your email and password, then try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
