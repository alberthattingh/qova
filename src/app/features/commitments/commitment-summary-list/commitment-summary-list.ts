import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { ABSOLUTE_ROUTES } from '../../../constants/app-routes';
import { CommitmentStatus } from '../../../constants/commitment-statuses';
import { Commitment } from '../../../models/commitment.model';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-commitment-summary-list',
  imports: [ButtonModule, CardModule, DatePipe, EmptyState, RouterLink, TagModule, TitleCasePipe],
  templateUrl: './commitment-summary-list.html',
  styleUrl: './commitment-summary-list.scss',
})
export class CommitmentSummaryList {
  @Input() commitments: Commitment[] = [];
  @Input() title = 'Commitments';
  @Input() emptyTitle = 'No commitments';
  @Input() emptyMessage = 'Commitments will appear here.';
  @Input() managerView = false;

  @Output() activated = new EventEmitter<string>();
  @Output() completed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<string>();

  protected readonly CommitmentStatus = CommitmentStatus;
  protected readonly ABSOLUTE_ROUTES = ABSOLUTE_ROUTES;
}
