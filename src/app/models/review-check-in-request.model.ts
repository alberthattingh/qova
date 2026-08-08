import { CheckInReviewDecision } from '../constants/check-in-review-decisions';

export interface ReviewCheckInRequest {
  checkInId: string;
  decision: CheckInReviewDecision;
  comment: string | null;
}
