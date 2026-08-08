import { ProfileImageSource } from '../constants/avatar';

export interface PersistUserProfileUpdate {
  displayName: string;
  profileImageUrl: string;
  profileImageSource: ProfileImageSource;
}
