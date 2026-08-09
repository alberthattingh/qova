import { CheckInClaimedResult } from '../constants/check-in-claimed-results';

export interface CheckInFormValue {
  claimedResult: CheckInClaimedResult;
  comment: string | null;
  evidenceFiles: File[];
}
