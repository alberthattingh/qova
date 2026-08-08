import { CheckInStatus } from '../constants/check-in-statuses';

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
  status: CheckInStatus;
  submittedAt: Date;
}
