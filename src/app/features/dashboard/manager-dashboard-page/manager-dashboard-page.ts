import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { catchError, map, of, startWith } from 'rxjs';

import { ABSOLUTE_ROUTES } from '../../../constants/app-routes';
import { CHECK_IN_STATUS_LABELS } from '../../../constants/check-in-status-labels';
import { CheckInStatus } from '../../../constants/check-in-statuses';
import { ManagerDashboardCheckInItem } from '../../../models/manager-dashboard-check-in-item.model';
import { ManagerDashboard } from '../../../models/manager-dashboard.model';
import { ManagerDashboardService } from '../../../services/dashboard/manager-dashboard.service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { ReviewQueueList } from '../../review-queue/review-queue-list/review-queue-list';

@Component({
  selector: 'app-manager-dashboard-page',
  imports: [
    AsyncPipe,
    CardModule,
    DatePipe,
    EmptyState,
    ErrorState,
    LoadingState,
    RouterLink,
    ReviewQueueList,
    TagModule,
  ],
  templateUrl: './manager-dashboard-page.html',
  styleUrl: './manager-dashboard-page.scss',
})
export class ManagerDashboardPage {
  private readonly managerDashboard = inject(ManagerDashboardService);

  @Input() showHeading = true;

  protected readonly ABSOLUTE_ROUTES = ABSOLUTE_ROUTES;
  protected readonly dashboardState$ = this.managerDashboard.dashboard$().pipe(
    map((dashboard) => ({ isLoading: false, dashboard, error: null })),
    startWith({ isLoading: true, dashboard: null, error: null }),
    catchError((error) =>
      of({
        isLoading: false,
        dashboard: null,
        error:
          error instanceof Error
            ? error.message
            : 'Your manager dashboard could not be loaded.',
      }),
    ),
  );

  protected attentionCount(dashboard: ManagerDashboard): number {
    return (
      dashboard.awaitingReview.length +
      dashboard.missedCheckIns.length +
      dashboard.requestsRequiringAttention.length +
      dashboard.pendingInvitations.length
    );
  }

  protected statusLabel(item: ManagerDashboardCheckInItem): string {
    return CHECK_IN_STATUS_LABELS[item.checkIn.status];
  }

  protected statusSeverity(
    item: ManagerDashboardCheckInItem,
  ): 'secondary' | 'success' | 'warn' | 'danger' {
    if (item.checkIn.status === CheckInStatus.Failed) {
      return 'danger';
    }

    if (item.checkIn.status === CheckInStatus.Passed) {
      return 'success';
    }

    if (item.checkIn.status === CheckInStatus.Submitted) {
      return 'warn';
    }

    return 'secondary';
  }
}
