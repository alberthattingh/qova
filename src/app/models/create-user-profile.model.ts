import { ProfileImageSource } from '../constants/avatar';

export interface CreateUserProfile {
  id: string;
  displayName: string;
  email: string;
  profileImageUrl: string;
  profileImageSource: ProfileImageSource;
}
