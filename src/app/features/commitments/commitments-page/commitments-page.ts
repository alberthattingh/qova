import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

import { ABSOLUTE_ROUTES } from '../../../constants/app-routes';
import { CreateCommitmentRequest } from '../../../models/create-commitment-request.model';
import { CommitmentService } from '../../../services/commitments/commitment.service';
import { NotificationService } from '../../../services/notifications/notification.service';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { CommitmentForm } from '../commitment-form/commitment-form';
import { CommitmentSummaryList } from '../commitment-summary-list/commitment-summary-list';

@Component({
  selector: 'app-commitments-page',
  imports: [
    AsyncPipe,
    ButtonModule,
    CardModule,
    CommitmentForm,
    CommitmentSummaryList,
    DividerModule,
    LoadingState,
  ],
  templateUrl: './commitments-page.html',
  styleUrl: './commitments-page.scss',
})
export class CommitmentsPage {
  private readonly commitments = inject(CommitmentService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly workspace$ = this.commitments.workspace$();
  protected readonly isCreating = signal(false);
  protected readonly isWorking = signal(false);

  showCreateDialog(): void {
    this.isCreating.set(true);
  }

  hideCreateForm(): void {
    this.isCreating.set(false);
  }

  async createCommitment(request: CreateCommitmentRequest): Promise<void> {
    this.isWorking.set(true);

    try {
      const commitmentId = await this.commitments.createDraft(request);

      this.notifications.success('Commitment created', 'Draft saved.');
      this.isCreating.set(false);
      await this.router.navigateByUrl(ABSOLUTE_ROUTES.commitmentDetails(commitmentId));
    } catch (error) {
      this.notifications.error(
        'Unable to create commitment',
        error instanceof Error ? error.message : 'The commitment could not be created.',
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

  private async runAction(
    action: () => Promise<void>,
    successSummary: string,
  ): Promise<void> {
    this.isWorking.set(true);

    try {
      await action();
      this.notifications.success(successSummary, 'Commitments updated.');
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
