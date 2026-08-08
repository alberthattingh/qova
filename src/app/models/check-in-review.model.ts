import { CheckInReviewDecision } from '../constants/check-in-review-decisions';

export interface CheckInReview {
  id: string;
  checkInId: string;
  commitmentId: string;
  ownerUserId: string;
  managerUserIds: string[];
  reviewerUserId: string;
  decision: CheckInReviewDecision;
  comment: string | null;
  createdAt: Date;
}
