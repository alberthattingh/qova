import { CheckIn } from './check-in.model';
import { Commitment } from './commitment.model';
import { UserProfile } from './user-profile.model';

export interface ReviewQueueItem {
  id: string;
  checkIn: CheckIn;
  commitment: Commitment;
  user: UserProfile;
  requiresAction: boolean;
  priority: number;
}
