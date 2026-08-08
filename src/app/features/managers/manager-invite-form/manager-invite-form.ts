import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { ManagerInviteRequest } from '../../../models/manager-invite-request.model';

@Component({
  selector: 'app-manager-invite-form',
  imports: [ButtonModule, InputTextModule, ReactiveFormsModule],
  templateUrl: './manager-invite-form.html',
  styleUrl: './manager-invite-form.scss',
})
export class ManagerInviteForm {
  private readonly formBuilder = inject(FormBuilder);

  @Output() submitted = new EventEmitter<ManagerInviteRequest>();

  protected readonly form = this.formBuilder.nonNullable.group({
    managerEmail: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit({
      managerEmail: this.form.controls.managerEmail.value,
    });
    this.form.reset();
  }
}
