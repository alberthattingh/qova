import { CheckInReview } from './check-in-review.model';
import { CheckIn } from './check-in.model';
import { Commitment } from './commitment.model';

export interface UserDashboardReviewResult {
  checkIn: CheckIn;
  commitment: Commitment;
  review: CheckInReview;
}
