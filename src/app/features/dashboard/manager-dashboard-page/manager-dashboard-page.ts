import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import { CommitmentService } from '../../../services/commitments/commitment.service';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { ManagedCommitmentList } from '../../commitments/managed-commitment-list/managed-commitment-list';

@Component({
  selector: 'app-manager-dashboard-page',
  imports: [AsyncPipe, LoadingState, ManagedCommitmentList],
  templateUrl: './manager-dashboard-page.html',
  styleUrl: './manager-dashboard-page.scss',
})
export class ManagerDashboardPage {
  private readonly commitments = inject(CommitmentService);

  protected readonly workspace$ = this.commitments.workspace$();
}
