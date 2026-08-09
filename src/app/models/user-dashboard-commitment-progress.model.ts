import { CommitmentProgressMetrics } from './commitment-progress-metrics.model';
import { Commitment } from './commitment.model';

export interface UserDashboardCommitmentProgress {
  commitment: Commitment;
  metrics: CommitmentProgressMetrics;
}
