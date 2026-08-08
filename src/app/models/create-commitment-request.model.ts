import { CheckInFrequency } from '../constants/check-in-frequency';

export interface CreateCommitmentRequest {
  managerUserIds: string[];
  title: string;
  description: string;
  targetDescription: string;
  evidenceInstructions: string;
  startDate: Date;
  endDate: Date | null;
  checkInFrequency: CheckInFrequency;
  checkInTime: string;
}
