export interface SubmitMissedCheckInRequest {
  checkInId: string;
  claimedResult: string;
  comment: string | null;
  evidenceFiles: File[];
}
