import { CheckInStatus } from '../constants/check-in-statuses';
import { CheckInEvidence } from './check-in-evidence.model';
import { CheckInReview } from './check-in-review.model';

export interface CheckIn {
  id: string;
  commitmentId: string;
  ownerUserId: string;
  managerUserIds: string[];
  userId: string;
  periodIndex: number;
  periodStartsAt: Date;
  periodEndsAt: Date;
  deadline: Date;
  claimedResult: string;
  comment: string | null;
  evidence: CheckInEvidence[];
  wasMissed: boolean;
  isLate: boolean;
  dueAt: Date;
  missedAt: Date | null;
  status: CheckInStatus;
  submittedAt: Date | null;
  reviews: CheckInReview[];
}
