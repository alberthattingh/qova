import { CheckInStatus } from './check-in-statuses';

export const CHECK_IN_STATUS_LABELS: Record<CheckInStatus, string> = {
  [CheckInStatus.Submitted]: 'Submitted',
  [CheckInStatus.Missed]: 'Missed',
  [CheckInStatus.Passed]: 'Passed',
  [CheckInStatus.Failed]: 'Failed',
  [CheckInStatus.NeedsMoreEvidence]: 'Needs more evidence',
};
