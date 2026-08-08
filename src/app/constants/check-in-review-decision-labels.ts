import { CheckInReviewDecision } from './check-in-review-decisions';

export const CHECK_IN_REVIEW_DECISION_LABELS: Record<
  CheckInReviewDecision,
  string
> = {
  [CheckInReviewDecision.Passed]: 'Passed',
  [CheckInReviewDecision.Failed]: 'Failed',
  [CheckInReviewDecision.NeedsMoreEvidence]: 'Needs more evidence',
};
