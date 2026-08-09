import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { ABSOLUTE_ROUTES } from '../../../constants/app-routes';
import { ManagedCommitment } from '../../../models/managed-commitment.model';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-managed-commitment-list',
  imports: [CardModule, DatePipe, EmptyState, RouterLink, TagModule, TitleCasePipe],
  templateUrl: './managed-commitment-list.html',
  styleUrl: './managed-commitment-list.scss',
})
export class ManagedCommitmentList {
  @Input() commitments: ManagedCommitment[] = [];
  @Input() title = 'Commitments you sponsor';
  @Input() emptyTitle = 'No assigned commitments';
  @Input() emptyMessage = 'Commitments assigned to you as sponsor will appear here.';

  protected readonly ABSOLUTE_ROUTES = ABSOLUTE_ROUTES;
}
