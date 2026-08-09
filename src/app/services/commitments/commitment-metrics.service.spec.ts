import { CheckInClaimedResult } from '../../constants/check-in-claimed-results';
import { CheckInStatus } from '../../constants/check-in-statuses';
import { CheckIn } from '../../models/check-in.model';
import { CommitmentMetricsService } from './commitment-metrics.service';

describe('CommitmentMetricsService', () => {
  let service: CommitmentMetricsService;

  beforeEach(() => {
    service = new CommitmentMetricsService();
  });

  it('separates goal success from on-time reporting success', () => {
    const metrics = service.metricsForCheckIns([
      checkIn({
        id: 'on-time-passed',
        periodIndex: 1,
        status: CheckInStatus.Passed,
        submittedAt: new Date('2026-08-01T08:00:00.000Z'),
        dueAt: new Date('2026-08-01T09:00:00.000Z'),
      }),
      checkIn({
        id: 'on-time-failed',
        periodIndex: 2,
        status: CheckInStatus.Failed,
        claimedResult: CheckInClaimedResult.Failed,
        submittedAt: new Date('2026-08-02T08:00:00.000Z'),
        dueAt: new Date('2026-08-02T09:00:00.000Z'),
      }),
    ]);

    expect(metrics.goal.passed).toBe(1);
    expect(metrics.goal.failed).toBe(1);
    expect(metrics.goal.passRate).toBe(0.5);
    expect(metrics.reporting.submittedOnTime).toBe(2);
    expect(metrics.reporting.reportingComplianceRate).toBe(1);
  });

  it('counts late submissions as reporting failures while preserving goal results', () => {
    const metrics = service.metricsForCheckIns([
      checkIn({
        id: 'late-passed',
        periodIndex: 1,
        status: CheckInStatus.Passed,
        wasMissed: true,
        submittedAt: new Date('2026-08-04T08:00:00.000Z'),
        dueAt: new Date('2026-08-01T09:00:00.000Z'),
      }),
      checkIn({
        id: 'late-failed',
        periodIndex: 2,
        status: CheckInStatus.Failed,
        claimedResult: CheckInClaimedResult.Failed,
        wasMissed: true,
        submittedAt: new Date('2026-08-05T08:00:00.000Z'),
        dueAt: new Date('2026-08-02T09:00:00.000Z'),
      }),
      checkIn({
        id: 'missed',
        periodIndex: 3,
        status: CheckInStatus.Missed,
        claimedResult: null,
        wasMissed: true,
        submittedAt: null,
        dueAt: new Date('2026-08-03T09:00:00.000Z'),
      }),
    ]);

    expect(metrics.goal.passed).toBe(1);
    expect(metrics.goal.failed).toBe(1);
    expect(metrics.goal.unresolved).toBe(1);
    expect(metrics.reporting.submittedLate).toBe(2);
    expect(metrics.reporting.missed).toBe(1);
    expect(metrics.reporting.reportingComplianceRate).toBe(0);
  });

  it('calculates current and longest successful streaks by reporting period', () => {
    const metrics = service.metricsForCheckIns([
      checkIn({ id: 'first', periodIndex: 1, status: CheckInStatus.Passed }),
      checkIn({ id: 'second', periodIndex: 2, status: CheckInStatus.Passed }),
      checkIn({ id: 'third', periodIndex: 3, status: CheckInStatus.Failed }),
      checkIn({ id: 'fourth', periodIndex: 4, status: CheckInStatus.Passed }),
    ]);

    expect(metrics.goal.currentSuccessfulStreak).toBe(1);
    expect(metrics.goal.longestSuccessfulStreak).toBe(2);
  });
});

function checkIn(overrides: Partial<CheckIn>): CheckIn {
  const periodIndex = overrides.periodIndex ?? 1;

  return {
    id: overrides.id ?? `check-in-${periodIndex}`,
    commitmentId: 'commitment-1',
    ownerUserId: 'owner-1',
    managerUserIds: ['manager-1'],
    userId: 'owner-1',
    periodIndex,
    periodStartsAt:
      overrides.periodStartsAt ?? new Date(`2026-08-0${periodIndex}T00:00:00Z`),
    periodEndsAt:
      overrides.periodEndsAt ?? new Date(`2026-08-0${periodIndex}T23:59:59Z`),
    deadline: overrides.deadline ?? new Date(`2026-08-0${periodIndex}T09:00:00Z`),
    claimedResult: overrides.claimedResult ?? CheckInClaimedResult.Passed,
    comment: null,
    evidence: [],
    wasMissed: overrides.wasMissed ?? false,
    isLate: overrides.isLate ?? overrides.wasMissed ?? false,
    dueAt: overrides.dueAt ?? new Date(`2026-08-0${periodIndex}T09:00:00Z`),
    missedAt: overrides.missedAt ?? null,
    status: overrides.status ?? CheckInStatus.Submitted,
    submittedAt:
      'submittedAt' in overrides
        ? (overrides.submittedAt ?? null)
        : new Date(`2026-08-0${periodIndex}T08:00:00Z`),
    reviews: [],
  };
}
