import { ReviewStatus } from '../constants/review-statuses';

export interface ReviewItem {
  id: string;
  commitmentId: string;
  checkInId: string;
  status: ReviewStatus;
  reviewerId?: string;
}
