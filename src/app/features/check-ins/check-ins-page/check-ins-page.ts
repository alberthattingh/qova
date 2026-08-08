import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { catchError, map, of, startWith } from 'rxjs';

import { CheckInStatus } from '../../../constants/check-in-statuses';
import { CheckInFormValue } from '../../../models/check-in-form-value.model';
import { DueCheckIn } from '../../../models/due-check-in.model';
import { CheckInService } from '../../../services/check-ins/check-in.service';
import { NotificationService } from '../../../services/notifications/notification.service';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { CheckInList } from '../check-in-list/check-in-list';

@Component({
  selector: 'app-check-ins-page',
  imports: [AsyncPipe, CheckInList, DividerModule, ErrorState, LoadingState],
  templateUrl: './check-ins-page.html',
  styleUrl: './check-ins-page.scss',
})
export class CheckInsPage {
  private readonly checkIns = inject(CheckInService);
  private readonly notifications = inject(NotificationService);

  protected readonly dashboardState$ = this.checkIns.dashboard$().pipe(
    map((dashboard) => ({ isLoading: false, dashboard, error: null })),
    startWith({ isLoading: true, dashboard: null, error: null }),
    catchError((error) =>
      of({
        isLoading: false,
        dashboard: null,
        error: this.errorMessage(error, 'Your check-ins could not be loaded.'),
      }),
    ),
  );
  protected readonly isSubmitting = signal(false);

  protected async submitCheckIn(
    checkIn: DueCheckIn,
    value: CheckInFormValue,
  ): Promise<void> {
    this.isSubmitting.set(true);

    try {
      if (checkIn.persistedCheckIn?.status === CheckInStatus.Missed) {
        await this.checkIns.submitMissedCheckIn({
          checkInId: checkIn.persistedCheckIn.id,
          claimedResult: value.claimedResult,
          comment: value.comment,
          evidenceFiles: value.evidenceFiles,
        });
      } else if (
        checkIn.persistedCheckIn?.status === CheckInStatus.NeedsMoreEvidence
      ) {
        await this.checkIns.resubmitCheckIn({
          checkInId: checkIn.persistedCheckIn.id,
          claimedResult: value.claimedResult,
          comment: value.comment,
          evidenceFiles: value.evidenceFiles,
        });
      } else {
        await this.checkIns.submitCurrentCheckIn({
          commitmentId: checkIn.commitment.id,
          claimedResult: value.claimedResult,
          comment: value.comment,
          evidenceFiles: value.evidenceFiles,
        });
      }
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

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
