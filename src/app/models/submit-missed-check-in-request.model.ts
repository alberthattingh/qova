import { CheckInClaimedResult } from '../constants/check-in-claimed-results';

export interface SubmitMissedCheckInRequest {
  checkInId: string;
  claimedResult: CheckInClaimedResult;
  comment: string | null;
  evidenceFiles: File[];
}
