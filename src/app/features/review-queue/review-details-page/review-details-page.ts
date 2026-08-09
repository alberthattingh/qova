import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { catchError, map, of, startWith } from 'rxjs';

import { ABSOLUTE_ROUTES, RouteParam } from '../../../constants/app-routes';
import { CHECK_IN_CLAIMED_RESULT_LABELS } from '../../../constants/check-in-claimed-result-labels';
import { CheckInClaimedResult } from '../../../constants/check-in-claimed-results';
import { CHECK_IN_REVIEW_DECISION_LABELS } from '../../../constants/check-in-review-decision-labels';
import { CheckInReviewDecision } from '../../../constants/check-in-review-decisions';
import { CHECK_IN_STATUS_LABELS } from '../../../constants/check-in-status-labels';
import { CheckInStatus } from '../../../constants/check-in-statuses';
import { CheckInReviewFormValue } from '../../../models/check-in-review-form-value.model';
import { CheckIn } from '../../../models/check-in.model';
import { NotificationService } from '../../../services/notifications/notification.service';
import { CheckInReviewService } from '../../../services/reviews/check-in-review.service';
import { ReviewQueueService } from '../../../services/reviews/review-queue.service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { CheckInEvidenceList } from '../../check-ins/check-in-evidence-list/check-in-evidence-list';
import { CheckInReviewForm } from '../../commitments/check-in-review-form/check-in-review-form';

@Component({
  selector: 'app-review-details-page',
  imports: [
    AsyncPipe,
    CardModule,
    CheckInEvidenceList,
    CheckInReviewForm,
    DatePipe,
    EmptyState,
    ErrorState,
    LoadingState,
    TagModule,
  ],
  templateUrl: './review-details-page.html',
  styleUrl: './review-details-page.scss',
})
export class ReviewDetailsPage {
  private readonly checkInReviews = inject(CheckInReviewService);
  private readonly notifications = inject(NotificationService);
  private readonly reviewQueue = inject(ReviewQueueService);
  private readonly route = inject(ActivatedRoute);

  protected readonly ABSOLUTE_ROUTES = ABSOLUTE_ROUTES;
  protected readonly claimedResultLabels = CHECK_IN_CLAIMED_RESULT_LABELS;
  protected readonly reviewDecisionLabels = CHECK_IN_REVIEW_DECISION_LABELS;
  protected readonly statusLabels = CHECK_IN_STATUS_LABELS;
  protected readonly checkInId =
    this.route.snapshot.paramMap.get(RouteParam.CheckInId) ?? '';
  protected readonly reviewState$ = this.reviewQueue
    .reviewDetails$(this.checkInId)
    .pipe(
      map((details) => ({ isLoading: false, details, error: null })),
      startWith({ isLoading: true, details: null, error: null }),
      catchError((error) =>
        of({
          isLoading: false,
          details: null,
          error: this.errorMessage(error, 'The review could not be loaded.'),
        }),
      ),
    );
  protected readonly isReviewing = signal(false);

  protected statusSeverity(
    checkIn: CheckIn,
  ): 'success' | 'secondary' | 'warn' | 'danger' {
    if (checkIn.status === CheckInStatus.Passed) {
      return 'success';
    }

    if (checkIn.status === CheckInStatus.Failed) {
      return 'danger';
    }

    if (
      checkIn.status === CheckInStatus.Submitted ||
      checkIn.status === CheckInStatus.NeedsMoreEvidence
    ) {
      return 'warn';
    }

    return 'secondary';
  }

  protected statusLabel(checkIn: CheckIn): string {
    return this.statusLabels[checkIn.status];
  }

  protected reviewDecisionLabel(decision: CheckInReviewDecision): string {
    return this.reviewDecisionLabels[decision];
  }

  protected claimedResultLabel(result: CheckInClaimedResult): string {
    return this.claimedResultLabels[result];
  }

  protected claimedResultSeverity(
    result: CheckInClaimedResult,
  ): 'success' | 'danger' {
    return result === CheckInClaimedResult.Passed ? 'success' : 'danger';
  }

  protected async reviewCheckIn(
    checkIn: CheckIn,
    value: CheckInReviewFormValue,
  ): Promise<void> {
    this.isReviewing.set(true);

    try {
      await this.checkInReviews.reviewCheckIn({
        checkInId: checkIn.id,
        decision: value.decision,
        comment: value.comment,
      });
      this.notifications.success('Review saved', 'The check-in was reviewed.');
    } catch (error) {
      this.notifications.error(
        'Review failed',
        this.errorMessage(error, 'The review could not be saved.'),
      );
    } finally {
      this.isReviewing.set(false);
    }
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
