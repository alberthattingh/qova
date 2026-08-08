import { CheckInEvidenceFileCategory } from '../constants/check-in-evidence-file-types';

export interface CheckInEvidence {
  id: string;
  checkInId: string;
  commitmentId: string;
  ownerUserId: string;
  managerUserIds: string[];
  periodIndex: number;
  fileName: string;
  contentType: string;
  size: number;
  storagePath: string;
  category: CheckInEvidenceFileCategory;
  downloadUrl: string | null;
  createdAt: Date;
}
