import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { ConfirmationDialogOptions } from '../../../models/confirmation-dialog-options.model';

@Component({
  selector: 'app-confirmation-dialog',
  imports: [ButtonModule, DialogModule],
  templateUrl: './confirmation-dialog.html',
})
export class ConfirmationDialog {
  @Input() visible = false;
  @Input() options: ConfirmationDialogOptions = {
    title: 'Confirm action',
    message: 'Are you sure you want to continue?',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
  };

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  cancel(): void {
    this.visibleChange.emit(false);
    this.cancelled.emit();
  }

  confirm(): void {
    this.visibleChange.emit(false);
    this.confirmed.emit();
  }
}
