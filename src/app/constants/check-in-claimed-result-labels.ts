import { CheckInClaimedResult } from './check-in-claimed-results';

export const CHECK_IN_CLAIMED_RESULT_LABELS: Record<
  CheckInClaimedResult,
  string
> = {
  [CheckInClaimedResult.Passed]: 'Passed',
  [CheckInClaimedResult.Failed]: 'Failed',
};
