import { CheckIn } from './check-in.model';
import { Commitment } from './commitment.model';
import { UserProfile } from './user-profile.model';

export interface ReviewDetails {
  checkIn: CheckIn;
  commitment: Commitment;
  user: UserProfile;
  canReview: boolean;
}
