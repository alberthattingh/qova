import { AsyncPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { map, startWith } from 'rxjs';

import { RouteParam } from '../../../constants/app-routes';
import { CommitmentStatus } from '../../../constants/commitment-statuses';
import { CheckIn } from '../../../models/check-in.model';
import { CheckInReviewFormValue } from '../../../models/check-in-review-form-value.model';
import { Commitment } from '../../../models/commitment.model';
import { CreateCommitmentRequest } from '../../../models/create-commitment-request.model';
import { AuthService } from '../../../services/auth/auth.service';
import { CommitmentService } from '../../../services/commitments/commitment.service';
import { NotificationService } from '../../../services/notifications/notification.service';
import { CheckInReviewService } from '../../../services/reviews/check-in-review.service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { CheckInHistory } from '../check-in-history/check-in-history';
import { CommitmentForm } from '../commitment-form/commitment-form';
import { CommitmentSchedule } from '../commitment-schedule/commitment-schedule';

@Component({
  selector: 'app-commitment-details-page',
  imports: [
    AsyncPipe,
    ButtonModule,
    CardModule,
    CheckInHistory,
    CommitmentForm,
    CommitmentSchedule,
    DatePipe,
    DividerModule,
    EmptyState,
    LoadingState,
    TagModule,
    TitleCasePipe,
  ],
  templateUrl: './commitment-details-page.html',
  styleUrl: './commitment-details-page.scss',
})
export class CommitmentDetailsPage {
  private readonly auth = inject(AuthService);
  private readonly checkInReviews = inject(CheckInReviewService);
  private readonly commitments = inject(CommitmentService);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  protected readonly commitmentId =
    this.route.snapshot.paramMap.get(RouteParam.CommitmentId) ?? '';
  protected readonly detailsState$ =
    this.commitments.commitmentDetails$(this.commitmentId).pipe(
      map((details) => ({ isLoading: false, details })),
      startWith({ isLoading: true, details: null }),
    );
  protected readonly currentUserId$ = this.auth.currentAuthSession$.pipe(
    map((session) => session?.id ?? null),
  );
  protected readonly workspace$ = this.commitments.workspace$();
  protected readonly CommitmentStatus = CommitmentStatus;
  protected readonly isEditing = signal(false);
  protected readonly isWorking = signal(false);
  protected readonly isReviewing = signal(false);

  showEditForm(): void {
    this.isEditing.set(true);
  }

  hideEditForm(): void {
    this.isEditing.set(false);
  }

  async saveTerms(
    commitment: Commitment,
    request: CreateCommitmentRequest,
  ): Promise<void> {
    this.isWorking.set(true);

    try {
      if (commitment.status === CommitmentStatus.Draft) {
        await this.commitments.updateDraft({
          commitmentId: commitment.id,
          ...request,
        });
      } else {
        await this.commitments.reviseActiveTerms({
          commitmentId: commitment.id,
          ...request,
        });
      }

      this.notifications.success('Commitment saved', 'Terms updated.');
      this.isEditing.set(false);
    } catch (error) {
      this.notifications.error(
        'Unable to save commitment',
        error instanceof Error ? error.message : 'The commitment could not be saved.',
      );
    } finally {
      this.isWorking.set(false);
    }
  }

  async activateCommitment(commitmentId: string): Promise<void> {
    await this.runAction(
      () => this.commitments.activate(commitmentId),
      'Commitment activated',
    );
  }

  async completeCommitment(commitmentId: string): Promise<void> {
    await this.runAction(
      () => this.commitments.complete(commitmentId),
      'Commitment completed',
    );
  }

  async cancelCommitment(commitmentId: string): Promise<void> {
    await this.runAction(
      () => this.commitments.cancel(commitmentId),
      'Commitment cancelled',
    );
  }

  async reviewCheckIn(
    checkIn: CheckIn,
    value: CheckInReviewFormValue,
  ): Promise<void> {
    this.isReviewing.set(true);

    try {
      await this.checkInReviews.reviewCheckIn({
        checkInId: checkIn.id,
        decision: value.decision,
        comment: value.comment,
      });
      this.notifications.success('Review saved', 'The check-in was reviewed.');
    } catch (error) {
      this.notifications.error(
        'Review failed',
        error instanceof Error ? error.message : 'The review could not be saved.',
      );
    } finally {
      this.isReviewing.set(false);
    }
  }

  private async runAction(
    action: () => Promise<void>,
    successSummary: string,
  ): Promise<void> {
    this.isWorking.set(true);

    try {
      await action();
      this.notifications.success(successSummary, 'Commitment updated.');
    } catch (error) {
      this.notifications.error(
        'Commitment action failed',
        error instanceof Error ? error.message : 'The commitment action failed.',
      );
    } finally {
      this.isWorking.set(false);
    }
  }
}
