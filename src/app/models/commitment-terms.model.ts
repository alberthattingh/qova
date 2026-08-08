import { CheckInFrequency } from '../constants/check-in-frequency';
import { CommitmentManager } from './commitment-manager.model';

export interface CommitmentTerms {
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
}
