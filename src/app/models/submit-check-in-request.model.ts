import { CheckInClaimedResult } from '../constants/check-in-claimed-results';

export interface SubmitCheckInRequest {
  commitmentId: string;
  claimedResult: CheckInClaimedResult;
  comment: string | null;
  evidenceFiles: File[];
}
