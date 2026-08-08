import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { catchError, map, of, startWith } from 'rxjs';

import { ReviewStatus } from '../../../constants/review-statuses';
import { ReviewQueueService } from '../../../services/reviews/review-queue.service';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { ReviewQueueList } from '../review-queue-list/review-queue-list';

@Component({
  selector: 'app-review-queue-page',
  imports: [AsyncPipe, ErrorState, LoadingState, ReviewQueueList, TagModule],
  templateUrl: './review-queue-page.html',
  styleUrl: './review-queue-page.scss',
})
export class ReviewQueuePage {
  private readonly reviewQueue = inject(ReviewQueueService);

  protected readonly queueState$ = this.reviewQueue.queue$().pipe(
    map((queue) => ({ isLoading: false, queue, error: null })),
    startWith({ isLoading: true, queue: null, error: null }),
    catchError((error) =>
      of({
        isLoading: false,
        queue: null,
        error: this.errorMessage(error, 'The review queue could not be loaded.'),
      }),
    ),
  );
  protected readonly status = ReviewStatus.Pending;

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
