import { DueCheckInStatus } from '../constants/due-check-in-statuses';
import { CheckInStatus } from '../constants/check-in-statuses';
import { CheckIn } from './check-in.model';
import { CheckInPeriod } from './check-in-period.model';
import { Commitment } from './commitment.model';

export interface DueCheckIn {
  id: string;
  commitment: Commitment;
  period: CheckInPeriod;
  persistedCheckIn: CheckIn | null;
  status: CheckInStatus | DueCheckInStatus;
  canSubmit: boolean;
}
