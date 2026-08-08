import { Component, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { ConfirmationDialogOptions } from '../../../models/confirmation-dialog-options.model';
import { ConfirmationDialog } from '../../../shared/components/confirmation-dialog/confirmation-dialog';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-commitments-page',
  imports: [ButtonModule, ConfirmationDialog, EmptyState],
  templateUrl: './commitments-page.html',
  styleUrl: './commitments-page.scss',
})
export class CommitmentsPage {
  protected readonly isConfirmingCreate = signal(false);
  protected readonly createDialogOptions: ConfirmationDialogOptions = {
    title: 'Create commitment',
    message: 'Start a new commitment draft?',
    confirmLabel: 'Create',
    cancelLabel: 'Cancel',
  };

  showCreateDialog(): void {
    this.isConfirmingCreate.set(true);
  }
}
