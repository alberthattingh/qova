import { Injectable } from '@angular/core';

import { CheckInStatus } from '../../constants/check-in-statuses';
import { CheckIn } from '../../models/check-in.model';
import { CommitmentProgressMetrics } from '../../models/commitment-progress-metrics.model';

@Injectable({
  providedIn: 'root',
})
export class CommitmentMetricsService {
  metricsForCheckIns(checkIns: CheckIn[]): CommitmentProgressMetrics {
    const sortedCheckIns = [...checkIns].sort(
      (a, b) => a.periodStartsAt.getTime() - b.periodStartsAt.getTime(),
    );

    return {
      goal: {
        passed: this.passedCount(sortedCheckIns),
        failed: this.failedCount(sortedCheckIns),
        unresolved: this.unresolvedCount(sortedCheckIns),
        passRate: this.passRate(sortedCheckIns),
        currentSuccessfulStreak: this.currentSuccessfulStreak(sortedCheckIns),
        longestSuccessfulStreak: this.longestSuccessfulStreak(sortedCheckIns),
      },
      reporting: {
        submittedOnTime: this.submittedOnTimeCount(sortedCheckIns),
        missed: this.missedCount(sortedCheckIns),
        submittedLate: this.submittedLateCount(sortedCheckIns),
        reportingComplianceRate: this.reportingComplianceRate(sortedCheckIns),
      },
    };
  }

  private passedCount(checkIns: CheckIn[]): number {
    return checkIns.filter((checkIn) => checkIn.status === CheckInStatus.Passed)
      .length;
  }

  private failedCount(checkIns: CheckIn[]): number {
    return checkIns.filter((checkIn) => checkIn.status === CheckInStatus.Failed)
      .length;
  }

  private unresolvedCount(checkIns: CheckIn[]): number {
    return checkIns.filter(
      (checkIn) =>
        checkIn.status !== CheckInStatus.Passed &&
        checkIn.status !== CheckInStatus.Failed,
    ).length;
  }

  private passRate(checkIns: CheckIn[]): number | null {
    const passed = this.passedCount(checkIns);
    const resolved = passed + this.failedCount(checkIns);

    return resolved === 0 ? null : passed / resolved;
  }

  private currentSuccessfulStreak(checkIns: CheckIn[]): number {
    return [...checkIns]
      .reverse()
      .reduce(
        (streak, checkIn) =>
          streak.isCounting && checkIn.status === CheckInStatus.Passed
            ? { count: streak.count + 1, isCounting: true }
            : { count: streak.count, isCounting: false },
        { count: 0, isCounting: true },
      ).count;
  }

  private longestSuccessfulStreak(checkIns: CheckIn[]): number {
    return checkIns.reduce(
      (streak, checkIn) => {
        const current =
          checkIn.status === CheckInStatus.Passed ? streak.current + 1 : 0;

        return {
          current,
          longest: Math.max(streak.longest, current),
        };
      },
      { current: 0, longest: 0 },
    ).longest;
  }

  private submittedOnTimeCount(checkIns: CheckIn[]): number {
    return checkIns.filter((checkIn) => this.isSubmittedOnTime(checkIn)).length;
  }

  private submittedLateCount(checkIns: CheckIn[]): number {
    return checkIns.filter((checkIn) => this.isSubmittedLate(checkIn)).length;
  }

  private missedCount(checkIns: CheckIn[]): number {
    return checkIns.filter((checkIn) => this.isUnsubmittedMissed(checkIn)).length;
  }

  private reportingComplianceRate(checkIns: CheckIn[]): number | null {
    const submittedOnTime = this.submittedOnTimeCount(checkIns);
    const reportable =
      submittedOnTime +
      this.submittedLateCount(checkIns) +
      this.missedCount(checkIns);

    return reportable === 0 ? null : submittedOnTime / reportable;
  }

  private isSubmittedOnTime(checkIn: CheckIn): boolean {
    return (
      checkIn.submittedAt !== null &&
      !checkIn.wasMissed &&
      checkIn.submittedAt.getTime() <= checkIn.dueAt.getTime()
    );
  }

  private isSubmittedLate(checkIn: CheckIn): boolean {
    return checkIn.submittedAt !== null && checkIn.wasMissed;
  }

  private isUnsubmittedMissed(checkIn: CheckIn): boolean {
    return checkIn.submittedAt === null && checkIn.wasMissed;
  }
}
