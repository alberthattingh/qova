import { ManagerInvitation } from './manager-invitation.model';
import { ManagerRelationship } from './manager-relationship.model';
import { ReviewQueueItem } from './review-queue-item.model';
import { ManagerDashboardCheckInItem } from './manager-dashboard-check-in-item.model';

export interface ManagerDashboard {
  awaitingReview: ReviewQueueItem[];
  missedCheckIns: ManagerDashboardCheckInItem[];
  requestsRequiringAttention: ManagerDashboardCheckInItem[];
  pendingInvitations: ManagerInvitation[];
  managedUsers: ManagerRelationship[];
  recentFailures: ManagerDashboardCheckInItem[];
  recentLateSubmissions: ManagerDashboardCheckInItem[];
}
