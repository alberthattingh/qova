import { Component, EventEmitter, Output, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { RegistrationCredentials } from '../../../models/registration-credentials.model';
import { DisplayNameService } from '../../../services/profile/display-name.service';

@Component({
  selector: 'app-register-form',
  imports: [ButtonModule, InputTextModule, PasswordModule, ReactiveFormsModule],
  templateUrl: './register-form.html',
  styleUrl: './register-form.scss',
})
export class RegisterForm {
  private readonly displayNames = inject(DisplayNameService);
  private readonly formBuilder = inject(FormBuilder);
  private profileImage: File | null = null;

  @Output() submitted = new EventEmitter<RegistrationCredentials>();

  protected readonly form = this.formBuilder.nonNullable.group({
    displayName: [
      this.displayNames.generate(),
      [Validators.required, Validators.maxLength(80)],
    ],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  }, {
    validators: [this.passwordsMatch()],
  });

  selectProfileImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.profileImage = input.files?.item(0) ?? null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { confirmPassword, ...credentials } = this.form.getRawValue();

    this.submitted.emit({
      ...credentials,
      profileImage: this.profileImage,
    });
  }

  private passwordsMatch(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;

      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }
}
