import { CheckInStatus } from '../constants/check-in-statuses';
import { CheckInEvidence } from './check-in-evidence.model';

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
  status: CheckInStatus;
  submittedAt: Date;
}
