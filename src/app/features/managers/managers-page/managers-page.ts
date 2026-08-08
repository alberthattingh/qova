import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

import { ManagerInviteRequest } from '../../../models/manager-invite-request.model';
import { ManagerRelationshipService } from '../../../services/manager-relationships/manager-relationship.service';
import { NotificationService } from '../../../services/notifications/notification.service';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { ManagerCard } from '../manager-card/manager-card';
import { ManagerInvitationList } from '../manager-invitation-list/manager-invitation-list';
import { ManagerInviteForm } from '../manager-invite-form/manager-invite-form';

@Component({
  selector: 'app-managers-page',
  imports: [
    AsyncPipe,
    CardModule,
    DividerModule,
    LoadingState,
    ManagerCard,
    ManagerInvitationList,
    ManagerInviteForm,
  ],
  templateUrl: './managers-page.html',
  styleUrl: './managers-page.scss',
})
export class ManagersPage {
  private readonly managerRelationships = inject(ManagerRelationshipService);
  private readonly notifications = inject(NotificationService);

  protected readonly dashboard$ = this.managerRelationships.relationshipDashboard$();
  protected readonly isWorking = signal(false);

  async inviteManager(request: ManagerInviteRequest): Promise<void> {
    await this.runAction(() =>
      this.managerRelationships.inviteManager(request.managerEmail),
      'Invitation sent',
    );
  }

  async acceptInvitation(invitationId: string): Promise<void> {
    await this.runAction(() =>
      this.managerRelationships.acceptInvitation(invitationId),
      'Invitation accepted',
    );
  }

  async declineInvitation(invitationId: string): Promise<void> {
    await this.runAction(() =>
      this.managerRelationships.declineInvitation(invitationId),
      'Invitation declined',
    );
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    await this.runAction(() =>
      this.managerRelationships.cancelInvitation(invitationId),
      'Invitation cancelled',
    );
  }

  async removeManager(relationshipId: string): Promise<void> {
    await this.runAction(() =>
      this.managerRelationships.removeManager(relationshipId),
      'Manager removed',
    );
  }

  async stopManaging(relationshipId: string): Promise<void> {
    await this.runAction(() =>
      this.managerRelationships.stopManaging(relationshipId),
      'Management stopped',
    );
  }

  private async runAction(
    action: () => Promise<void>,
    successSummary: string,
  ): Promise<void> {
    this.isWorking.set(true);

    try {
      await action();
      this.notifications.success(successSummary, 'Manager relationships updated.');
    } catch (error) {
      this.notifications.error(
        'Manager action failed',
        error instanceof Error ? error.message : 'The manager action failed.',
      );
    } finally {
      this.isWorking.set(false);
    }
  }
}
