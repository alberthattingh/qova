import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { ABSOLUTE_ROUTES } from '../../../constants/app-routes';
import { CheckInStatus } from '../../../constants/check-in-statuses';
import { ReviewQueueItem } from '../../../models/review-queue-item.model';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { CheckInEvidenceList } from '../../check-ins/check-in-evidence-list/check-in-evidence-list';

@Component({
  selector: 'app-review-queue-list',
  imports: [
    ButtonModule,
    CardModule,
    CheckInEvidenceList,
    DatePipe,
    EmptyState,
    RouterLink,
    TagModule,
    TitleCasePipe,
  ],
  templateUrl: './review-queue-list.html',
  styleUrl: './review-queue-list.scss',
})
export class ReviewQueueList {
  @Input() items: ReviewQueueItem[] = [];

  protected readonly ABSOLUTE_ROUTES = ABSOLUTE_ROUTES;

  protected statusSeverity(
    item: ReviewQueueItem,
  ): 'success' | 'secondary' | 'warn' {
    if (item.checkIn.status === CheckInStatus.Submitted) {
      return item.checkIn.isLate ? 'warn' : 'success';
    }

    return 'secondary';
  }
}
