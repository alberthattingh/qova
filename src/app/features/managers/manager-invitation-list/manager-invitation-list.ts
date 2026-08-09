import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { ManagerInvitation } from '../../../models/manager-invitation.model';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-manager-invitation-list',
  imports: [ButtonModule, CardModule, EmptyState, TagModule],
  templateUrl: './manager-invitation-list.html',
  styleUrl: './manager-invitation-list.scss',
})
export class ManagerInvitationList {
  @Input() invitations: ManagerInvitation[] = [];
  @Input() emptyTitle = 'No invitations';
  @Input() emptyMessage = 'Sponsor invitations will appear here.';
  @Input() mode: 'received' | 'sent' = 'received';

  @Output() accepted = new EventEmitter<string>();
  @Output() declined = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<string>();
}
