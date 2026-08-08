import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { ABSOLUTE_ROUTES } from '../../../constants/app-routes';
import { CHECK_IN_STATUS_LABELS } from '../../../constants/check-in-status-labels';
import { CheckInStatus } from '../../../constants/check-in-statuses';
import { CheckIn } from '../../../models/check-in.model';
import { ReviewQueueItem } from '../../../models/review-queue-item.model';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-review-queue-list',
  imports: [
    ButtonModule,
    CardModule,
    DatePipe,
    EmptyState,
    RouterLink,
    TagModule,
  ],
  templateUrl: './review-queue-list.html',
  styleUrl: './review-queue-list.scss',
})
export class ReviewQueueList {
  @Input() items: ReviewQueueItem[] = [];
  @Input() emptyTitle = 'No reviews waiting';
  @Input() emptyMessage =
    'Submitted and missed check-ins from people you manage will appear here.';

  protected readonly ABSOLUTE_ROUTES = ABSOLUTE_ROUTES;
  protected readonly statusLabels = CHECK_IN_STATUS_LABELS;

  protected statusSeverity(
    item: ReviewQueueItem,
  ): 'success' | 'secondary' | 'warn' {
    if (item.checkIn.status === CheckInStatus.Submitted) {
      return item.checkIn.isLate ? 'warn' : 'success';
    }

    return 'secondary';
  }

  protected evidenceLabel(item: ReviewQueueItem): string {
    const evidenceCount = item.checkIn.evidence.length;

    return `${evidenceCount} evidence file${evidenceCount === 1 ? '' : 's'}`;
  }

  protected statusLabel(checkIn: CheckIn): string {
    return this.statusLabels[checkIn.status];
  }
}
