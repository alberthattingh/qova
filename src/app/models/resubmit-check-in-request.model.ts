export interface ResubmitCheckInRequest {
  checkInId: string;
  claimedResult: string;
  comment: string | null;
  evidenceFiles: File[];
}
