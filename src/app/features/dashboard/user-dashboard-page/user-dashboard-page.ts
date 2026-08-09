import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { catchError, map, of, startWith } from 'rxjs';

import { ABSOLUTE_ROUTES } from '../../../constants/app-routes';
import { CHECK_IN_REVIEW_DECISION_LABELS } from '../../../constants/check-in-review-decision-labels';
import { CheckInReviewDecision } from '../../../constants/check-in-review-decisions';
import { CheckInStatus } from '../../../constants/check-in-statuses';
import { UserDashboard } from '../../../models/user-dashboard.model';
import { UserDashboardCommitmentProgress } from '../../../models/user-dashboard-commitment-progress.model';
import { UserDashboardReviewResult } from '../../../models/user-dashboard-review-result.model';
import { UserDashboardService } from '../../../services/dashboard/user-dashboard.service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { ManagerDashboardPage } from '../manager-dashboard-page/manager-dashboard-page';

@Component({
  selector: 'app-user-dashboard-page',
  imports: [
    AsyncPipe,
    ButtonModule,
    CardModule,
    DatePipe,
    EmptyState,
    ErrorState,
    LoadingState,
    ManagerDashboardPage,
    RouterLink,
    TabsModule,
    TagModule,
  ],
  templateUrl: './user-dashboard-page.html',
  styleUrl: './user-dashboard-page.scss',
})
export class UserDashboardPage {
  private readonly userDashboard = inject(UserDashboardService);

  protected readonly ABSOLUTE_ROUTES = ABSOLUTE_ROUTES;
  protected readonly dashboardState$ = this.userDashboard.dashboard$().pipe(
    map((dashboard) => ({ isLoading: false, dashboard, error: null })),
    startWith({ isLoading: true, dashboard: null, error: null }),
    catchError((error) =>
      of({
        isLoading: false,
        dashboard: null,
        error: error instanceof Error
          ? error.message
          : 'Your dashboard could not be loaded.',
      }),
    ),
  );

  protected actionCount(dashboard: UserDashboard): number {
    return dashboard.checkInsDueToday.length + dashboard.retroactiveCheckIns.length;
  }

  protected reviewDecisionLabel(decision: CheckInReviewDecision): string {
    return CHECK_IN_REVIEW_DECISION_LABELS[decision];
  }

  protected reviewSeverity(
    result: UserDashboardReviewResult,
  ): 'success' | 'danger' | 'warn' {
    if (result.review.decision === CheckInReviewDecision.Passed) {
      return 'success';
    }

    if (result.review.decision === CheckInReviewDecision.Failed) {
      return 'danger';
    }

    return 'warn';
  }

  protected progressRateLabel(
    commitment: UserDashboardCommitmentProgress,
  ): string {
    const rate = commitment.metrics.goal.passRate;

    return rate === null ? 'No resolved check-ins' : `${Math.round(rate * 100)}%`;
  }

  protected reportingRateLabel(
    commitment: UserDashboardCommitmentProgress,
  ): string {
    const rate = commitment.metrics.reporting.reportingComplianceRate;

    return rate === null ? 'No reports due' : `${Math.round(rate * 100)}%`;
  }

  protected isNeedsMoreEvidence(result: UserDashboardReviewResult): boolean {
    return result.checkIn.status === CheckInStatus.NeedsMoreEvidence;
  }
}
