import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TagModule } from 'primeng/tag';

import { ReviewStatus } from '../../../constants/review-statuses';
import { ReviewQueueService } from '../../../services/reviews/review-queue.service';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { ReviewQueueList } from '../review-queue-list/review-queue-list';

@Component({
  selector: 'app-review-queue-page',
  imports: [AsyncPipe, LoadingState, ReviewQueueList, TagModule],
  templateUrl: './review-queue-page.html',
  styleUrl: './review-queue-page.scss',
})
export class ReviewQueuePage {
  private readonly reviewQueue = inject(ReviewQueueService);

  protected readonly queue$ = this.reviewQueue.queue$();
  protected readonly status = ReviewStatus.Pending;
}
