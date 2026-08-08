import { CheckIn } from './check-in.model';
import { CheckInPeriod } from './check-in-period.model';

export interface CheckInPeriodSubmissionState {
  period: CheckInPeriod;
  persistedCheckIn: CheckIn | null;
  isAwaitingSubmission: boolean;
  isOverdue: boolean;
}
