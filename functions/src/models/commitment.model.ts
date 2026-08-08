import { Timestamp } from "firebase-admin/firestore";

import { CheckInFrequency } from "../constants/check-in-frequency";
import { CommitmentStatus } from "../constants/commitment-statuses";

export interface Commitment {
  id: string;
  ownerUserId: string;
  managerUserIds: string[];
  startDate: Date;
  endDate: Date | null;
  checkInFrequency: CheckInFrequency;
  checkInTime: string;
  timeZone: string;
  status: CommitmentStatus;
  nextCheckInAt: Date | null;
}

export interface PersistedCommitment {
  id: string;
  ownerUserId: string;
  managerUserIds: string[];
  startDate: Timestamp;
  endDate: Timestamp | null;
  checkInFrequency: CheckInFrequency;
  checkInTime: string;
  timeZone: string;
  status: CommitmentStatus;
  nextCheckInAt: Timestamp | null;
}
