import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { CheckInFormValue } from '../../../models/check-in-form-value.model';

@Component({
  selector: 'app-check-in-submit-form',
  imports: [ButtonModule, InputTextModule, ReactiveFormsModule, TextareaModule],
  templateUrl: './check-in-submit-form.html',
  styleUrl: './check-in-submit-form.scss',
})
export class CheckInSubmitForm {
  private readonly formBuilder = inject(FormBuilder);

  @Input() isSubmitting = false;
  @Output() submitted = new EventEmitter<CheckInFormValue>();

  protected readonly form = this.formBuilder.nonNullable.group({
    claimedResult: ['', [Validators.required, Validators.maxLength(500)]],
    comment: ['', [Validators.maxLength(1000)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.submitted.emit({
      claimedResult: value.claimedResult,
      comment: value.comment.trim() || null,
    });
    this.form.reset();
  }
}
