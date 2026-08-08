import { ManagerInvitationStatus } from '../constants/manager-invitation-statuses';

export interface ManagerInvitation {
  id: string;
  managedUserId: string;
  managedUserDisplayName: string;
  managedUserEmail: string;
  managedUserProfileImageUrl: string;
  managerUserId: string;
  managerDisplayName: string;
  managerEmail: string;
  managerProfileImageUrl: string;
  status: ManagerInvitationStatus;
  createdAt: Date;
  updatedAt: Date;
}
