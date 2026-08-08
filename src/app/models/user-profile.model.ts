import { UserRole } from '../constants/user-roles';

export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}
