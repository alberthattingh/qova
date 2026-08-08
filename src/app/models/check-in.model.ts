import { CheckInStatus } from '../constants/check-in-statuses';

export interface CheckIn {
  id: string;
  commitmentId: string;
  ownerUserId: string;
  managerUserIds: string[];
  userId: string;
  status: CheckInStatus;
  submittedAt?: Date;
}
