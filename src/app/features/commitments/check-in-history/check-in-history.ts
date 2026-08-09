import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { TagModule } from 'primeng/tag';

import { CHECK_IN_CLAIMED_RESULT_LABELS } from '../../../constants/check-in-claimed-result-labels';
import { CheckInClaimedResult } from '../../../constants/check-in-claimed-results';
import { CHECK_IN_REVIEW_DECISION_LABELS } from '../../../constants/check-in-review-decision-labels';
import { CHECK_IN_STATUS_LABELS } from '../../../constants/check-in-status-labels';
import { CheckInReviewDecision } from '../../../constants/check-in-review-decisions';
import { CheckInStatus } from '../../../constants/check-in-statuses';
import { DATE_FORMATS } from '../../../constants/date-formats';
import { CheckIn } from '../../../models/check-in.model';
import { CheckInReviewFormValue } from '../../../models/check-in-review-form-value.model';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { CheckInEvidenceList } from '../../check-ins/check-in-evidence-list/check-in-evidence-list';
import { CheckInReviewForm } from '../check-in-review-form/check-in-review-form';

@Component({
  selector: 'app-check-in-history',
  imports: [
    AccordionModule,
    CheckInEvidenceList,
    CheckInReviewForm,
    DatePipe,
    EmptyState,
    TagModule,
  ],
  templateUrl: './check-in-history.html',
  styleUrl: './check-in-history.scss',
})
export class CheckInHistory {
  @Input() checkIns: CheckIn[] = [];
  @Input() currentUserId: string | null = null;
  @Input() isReviewing = false;

  @Output() reviewed = new EventEmitter<{
    checkIn: CheckIn;
    value: CheckInReviewFormValue;
  }>();

  protected readonly claimedResultLabels = CHECK_IN_CLAIMED_RESULT_LABELS;
  protected readonly DATE_FORMATS = DATE_FORMATS;
  protected readonly reviewDecisionLabels = CHECK_IN_REVIEW_DECISION_LABELS;
  protected readonly statusLabels = CHECK_IN_STATUS_LABELS;

  protected canReview(checkIn: CheckIn): boolean {
    return (
      checkIn.status === CheckInStatus.Submitted &&
      this.currentUserId !== null &&
      checkIn.managerUserIds.includes(this.currentUserId)
    );
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

  protected submittedOrMissedLabel(checkIn: CheckIn): string {
    if (checkIn.wasMissed && checkIn.submittedAt) {
      return 'Submitted late';
    }

    return checkIn.wasMissed ? 'Missed' : 'Submitted';
  }

  protected submittedOrMissedAt(checkIn: CheckIn): Date | null {
    return checkIn.submittedAt ?? checkIn.missedAt;
  }

  protected evidenceLabel(checkIn: CheckIn): string {
    const evidenceCount = checkIn.evidence.length;

    return `${evidenceCount} file${evidenceCount === 1 ? '' : 's'}`;
  }
}
