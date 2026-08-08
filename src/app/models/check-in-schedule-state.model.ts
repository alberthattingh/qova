import { CheckInPeriod } from './check-in-period.model';

export interface CheckInScheduleState {
  currentPeriod: CheckInPeriod | null;
  previousPeriod: CheckInPeriod | null;
  nextPeriod: CheckInPeriod | null;
  nextCheckInDeadline: Date | null;
}
