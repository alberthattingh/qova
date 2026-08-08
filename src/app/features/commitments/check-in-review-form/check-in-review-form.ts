import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';

import { CheckInReviewDecision } from '../../../constants/check-in-review-decisions';
import { CheckInReviewFormValue } from '../../../models/check-in-review-form-value.model';

@Component({
  selector: 'app-check-in-review-form',
  imports: [ButtonModule, ReactiveFormsModule, TextareaModule],
  templateUrl: './check-in-review-form.html',
  styleUrl: './check-in-review-form.scss',
})
export class CheckInReviewForm {
  private readonly formBuilder = inject(FormBuilder);

  @Input() isSubmitting = false;
  @Output() reviewed = new EventEmitter<CheckInReviewFormValue>();

  protected readonly decision = CheckInReviewDecision;
  protected readonly form = this.formBuilder.nonNullable.group({
    comment: ['', [Validators.maxLength(1000)]],
  });

  submit(decision: CheckInReviewDecision): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.reviewed.emit({
      decision,
      comment: value.comment.trim() || null,
    });
    this.form.reset();
  }
}
