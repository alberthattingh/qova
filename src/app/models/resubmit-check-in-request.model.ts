import { CheckInClaimedResult } from '../constants/check-in-claimed-results';

export interface ResubmitCheckInRequest {
  checkInId: string;
  claimedResult: CheckInClaimedResult;
  comment: string | null;
  evidenceFiles: File[];
}
