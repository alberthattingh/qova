import { CheckIn } from './check-in.model';
import { CheckInPeriodSubmissionState } from './check-in-period-submission-state.model';
import { CheckInScheduleState } from './check-in-schedule-state.model';
import { CommitmentProgressMetrics } from './commitment-progress-metrics.model';
import { CommitmentVersion } from './commitment-version.model';
import { Commitment } from './commitment.model';

export interface CommitmentDetailView {
  commitment: Commitment;
  versions: CommitmentVersion[];
  checkIns: CheckIn[];
  metrics: CommitmentProgressMetrics;
  scheduleState: CheckInScheduleState;
  currentCheckInState: CheckInPeriodSubmissionState | null;
}
