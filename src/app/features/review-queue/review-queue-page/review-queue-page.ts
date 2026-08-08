import { Component } from '@angular/core';
import { TagModule } from 'primeng/tag';

import { ReviewStatus } from '../../../constants/review-statuses';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-review-queue-page',
  imports: [EmptyState, TagModule],
  templateUrl: './review-queue-page.html',
  styleUrl: './review-queue-page.scss',
})
export class ReviewQueuePage {
  protected readonly status = ReviewStatus.Pending;
}
