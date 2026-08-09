export interface CommitmentGoalMetrics {
  passed: number;
  failed: number;
  unresolved: number;
  passRate: number | null;
  currentSuccessfulStreak: number;
  longestSuccessfulStreak: number;
}

export interface CommitmentReportingMetrics {
  submittedOnTime: number;
  missed: number;
  submittedLate: number;
  reportingComplianceRate: number | null;
}

export interface CommitmentProgressMetrics {
  goal: CommitmentGoalMetrics;
  reporting: CommitmentReportingMetrics;
}
