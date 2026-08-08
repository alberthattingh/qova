import { CheckInEvidenceFileCategory } from '../constants/check-in-evidence-file-types';

export interface UploadedCheckInEvidence {
  fileName: string;
  contentType: string;
  size: number;
  storagePath: string;
  category: CheckInEvidenceFileCategory;
}
