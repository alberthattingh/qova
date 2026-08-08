import { UserRole } from '../constants/user-roles';

export interface AppUser {
  id: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}
