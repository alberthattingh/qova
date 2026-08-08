import { CheckInFrequency } from '../constants/check-in-frequency';
import { CommitmentStatus } from '../constants/commitment-statuses';
import { CommitmentManager } from './commitment-manager.model';

export interface Commitment {
  id: string;
  ownerUserId: string;
  managerUserIds: string[];
  managers: CommitmentManager[];
  title: string;
  description: string;
  targetDescription: string;
  evidenceInstructions: string;
  startDate: Date;
  endDate: Date | null;
  checkInFrequency: CheckInFrequency;
  checkInTime: string;
  timeZone: string;
  status: CommitmentStatus;
  currentVersionId: string | null;
  currentVersionNumber: number;
  createdAt: Date;
  updatedAt: Date;
}
