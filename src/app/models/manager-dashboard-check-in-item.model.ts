import { CheckIn } from './check-in.model';
import { Commitment } from './commitment.model';
import { UserProfile } from './user-profile.model';

export interface ManagerDashboardCheckInItem {
  checkIn: CheckIn;
  commitment: Commitment;
  user: UserProfile;
}
