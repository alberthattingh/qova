import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

import { ManagerInviteRequest } from '../../../models/manager-invite-request.model';
import { ManagerRelationshipService } from '../../../services/manager-relationships/manager-relationship.service';
import { ErrorState } from '../../../shared/components/error-state/error-state';
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
    ErrorState,
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

  protected readonly dashboard$ = this.managerRelationships.relationshipDashboard$();
  protected readonly isWorking = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  async inviteManager(request: ManagerInviteRequest): Promise<void> {
    await this.runAction(() =>
      this.managerRelationships.inviteManager(request.managerEmail),
    );
  }

  async acceptInvitation(invitationId: string): Promise<void> {
    await this.runAction(() =>
      this.managerRelationships.acceptInvitation(invitationId),
    );
  }

  async declineInvitation(invitationId: string): Promise<void> {
    await this.runAction(() =>
      this.managerRelationships.declineInvitation(invitationId),
    );
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    await this.runAction(() =>
      this.managerRelationships.cancelInvitation(invitationId),
    );
  }

  async removeManager(relationshipId: string): Promise<void> {
    await this.runAction(() =>
      this.managerRelationships.removeManager(relationshipId),
    );
  }

  async stopManaging(relationshipId: string): Promise<void> {
    await this.runAction(() =>
      this.managerRelationships.stopManaging(relationshipId),
    );
  }

  private async runAction(action: () => Promise<void>): Promise<void> {
    this.isWorking.set(true);
    this.errorMessage.set(null);

    try {
      await action();
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'The manager action failed.',
      );
    } finally {
      this.isWorking.set(false);
    }
  }
}
