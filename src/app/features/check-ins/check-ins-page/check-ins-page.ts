import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { DividerModule } from 'primeng/divider';

import { CheckInFormValue } from '../../../models/check-in-form-value.model';
import { DueCheckIn } from '../../../models/due-check-in.model';
import { CheckInService } from '../../../services/check-ins/check-in.service';
import { NotificationService } from '../../../services/notifications/notification.service';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { CheckInList } from '../check-in-list/check-in-list';

@Component({
  selector: 'app-check-ins-page',
  imports: [AsyncPipe, CheckInList, DividerModule, LoadingState],
  templateUrl: './check-ins-page.html',
  styleUrl: './check-ins-page.scss',
})
export class CheckInsPage {
  private readonly checkIns = inject(CheckInService);
  private readonly notifications = inject(NotificationService);

  protected readonly dashboard$ = this.checkIns.dashboard$();
  protected readonly isSubmitting = signal(false);

  protected async submitCheckIn(
    checkIn: DueCheckIn,
    value: CheckInFormValue,
  ): Promise<void> {
    this.isSubmitting.set(true);

    try {
      await this.checkIns.submitCurrentCheckIn({
        commitmentId: checkIn.commitment.id,
        claimedResult: value.claimedResult,
        comment: value.comment,
        evidenceFiles: value.evidenceFiles,
      });
      this.notifications.success(
        'Check-in submitted',
        'Your update has been sent to your manager.',
      );
    } catch {
      this.notifications.error(
        'Unable to submit check-in',
        'Please check the details and try again.',
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
