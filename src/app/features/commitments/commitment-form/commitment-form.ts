import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import { CheckInFrequency } from '../../../constants/check-in-frequency';
import { Commitment } from '../../../models/commitment.model';
import { CreateCommitmentRequest } from '../../../models/create-commitment-request.model';
import { ManagerRelationship } from '../../../models/manager-relationship.model';

@Component({
  selector: 'app-commitment-form',
  imports: [
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    ReactiveFormsModule,
    SelectModule,
    TextareaModule,
  ],
  templateUrl: './commitment-form.html',
  styleUrl: './commitment-form.scss',
})
export class CommitmentForm implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);

  @Input() availableManagers: ManagerRelationship[] = [];
  @Input() commitment: Commitment | null = null;
  @Input() isSubmitting = false;
  @Input() submitLabel = 'Save draft';

  @Output() submitted = new EventEmitter<CreateCommitmentRequest>();
  @Output() cancelled = new EventEmitter<void>();

  protected readonly frequencyOptions = [
    { label: 'Daily', value: CheckInFrequency.Daily },
    { label: 'Weekly', value: CheckInFrequency.Weekly },
    { label: 'Monthly', value: CheckInFrequency.Monthly },
  ];

  protected readonly form = this.formBuilder.nonNullable.group({
    managerUserIds: [[] as string[], [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    targetDescription: ['', [Validators.required, Validators.maxLength(1000)]],
    evidenceInstructions: ['', [Validators.required, Validators.maxLength(1000)]],
    startDate: ['', [Validators.required]],
    endDate: [''],
    checkInFrequency: [CheckInFrequency.Daily, [Validators.required]],
    checkInTime: ['09:00', [Validators.required]],
  });

  ngOnChanges(): void {
    if (!this.commitment) {
      return;
    }

    this.form.setValue({
      managerUserIds: this.commitment.managerUserIds,
      title: this.commitment.title,
      description: this.commitment.description,
      targetDescription: this.commitment.targetDescription,
      evidenceInstructions: this.commitment.evidenceInstructions,
      startDate: this.toDateInputValue(this.commitment.startDate),
      endDate: this.commitment.endDate
        ? this.toDateInputValue(this.commitment.endDate)
        : '',
      checkInFrequency: this.commitment.checkInFrequency,
      checkInTime: this.commitment.checkInTime,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.submitted.emit({
      managerUserIds: value.managerUserIds,
      title: value.title,
      description: value.description,
      targetDescription: value.targetDescription,
      evidenceInstructions: value.evidenceInstructions,
      startDate: this.fromDateInputValue(value.startDate),
      endDate: value.endDate ? this.fromDateInputValue(value.endDate) : null,
      checkInFrequency: value.checkInFrequency,
      checkInTime: value.checkInTime,
    });
  }

  clearEndDate(): void {
    this.form.controls.endDate.setValue('');
    this.form.controls.endDate.markAsDirty();
  }

  private toDateInputValue(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private fromDateInputValue(value: string): Date {
    return new Date(`${value}T00:00:00`);
  }

}
