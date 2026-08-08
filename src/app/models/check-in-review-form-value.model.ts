import { CheckInReviewDecision } from '../constants/check-in-review-decisions';

export interface CheckInReviewFormValue {
  decision: CheckInReviewDecision;
  comment: string | null;
}
