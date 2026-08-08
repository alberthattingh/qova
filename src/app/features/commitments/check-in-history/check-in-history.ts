import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TagModule } from 'primeng/tag';

import { CheckInStatus } from '../../../constants/check-in-statuses';
import { CheckIn } from '../../../models/check-in.model';
import { CheckInReviewFormValue } from '../../../models/check-in-review-form-value.model';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { CheckInEvidenceList } from '../../check-ins/check-in-evidence-list/check-in-evidence-list';
import { CheckInReviewForm } from '../check-in-review-form/check-in-review-form';

@Component({
  selector: 'app-check-in-history',
  imports: [
    CheckInEvidenceList,
    CheckInReviewForm,
    DatePipe,
    EmptyState,
    TagModule,
    TitleCasePipe,
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

  protected canReview(checkIn: CheckIn): boolean {
    return (
      checkIn.status === CheckInStatus.Submitted &&
      this.currentUserId !== null &&
      checkIn.managerUserIds.includes(this.currentUserId)
    );
  }
}
