import { ManagerRelationshipStatus } from '../constants/manager-relationship-statuses';

export interface ManagerRelationship {
  id: string;
  managedUserId: string;
  managedUserDisplayName: string;
  managedUserEmail: string;
  managedUserProfileImageUrl: string;
  managerUserId: string;
  managerDisplayName: string;
  managerEmail: string;
  managerProfileImageUrl: string;
  status: ManagerRelationshipStatus;
  createdAt: Date;
  updatedAt: Date;
  endedAt: Date | null;
  endedByUserId: string | null;
}
