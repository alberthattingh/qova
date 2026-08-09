import { DueCheckIn } from './due-check-in.model';
import { UserDashboardCommitmentProgress } from './user-dashboard-commitment-progress.model';
import { UserDashboardReviewResult } from './user-dashboard-review-result.model';

export interface UserDashboard {
  checkInsDueToday: DueCheckIn[];
  retroactiveCheckIns: DueCheckIn[];
  recentReviewResults: UserDashboardReviewResult[];
  activeCommitments: UserDashboardCommitmentProgress[];
}
