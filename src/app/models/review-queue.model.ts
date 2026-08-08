import { ReviewQueueItem } from './review-queue-item.model';

export interface ReviewQueue {
  items: ReviewQueueItem[];
  actionRequiredCount: number;
}
