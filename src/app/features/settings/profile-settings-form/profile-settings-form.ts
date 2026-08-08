import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { UpdateUserProfile } from '../../../models/update-user-profile.model';

@Component({
  selector: 'app-profile-settings-form',
  imports: [ButtonModule, InputTextModule, ReactiveFormsModule],
  templateUrl: './profile-settings-form.html',
  styleUrl: './profile-settings-form.scss',
})
export class ProfileSettingsForm {
  private readonly formBuilder = inject(FormBuilder);
  private profileImage: File | null = null;

  @Output() submitted = new EventEmitter<UpdateUserProfile>();
  @Input() profileImageUrl = '';

  protected readonly form = this.formBuilder.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(80)]],
  });

  @Input() set displayName(value: string | null) {
    this.form.controls.displayName.setValue(value ?? '');
  }

  selectProfileImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.profileImage = input.files?.item(0) ?? null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit({
      ...this.form.getRawValue(),
      profileImage: this.profileImage,
    });
  }
}
