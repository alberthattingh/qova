export interface SubmitCheckInRequest {
  commitmentId: string;
  claimedResult: string;
  comment: string | null;
}
