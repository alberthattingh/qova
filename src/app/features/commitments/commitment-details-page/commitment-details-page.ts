import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { RouteParam } from '../../../constants/app-routes';
import { CommitmentStatus } from '../../../constants/commitment-statuses';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-commitment-details-page',
  imports: [CardModule, EmptyState, TagModule],
  templateUrl: './commitment-details-page.html',
  styleUrl: './commitment-details-page.scss',
})
export class CommitmentDetailsPage {
  private readonly route = inject(ActivatedRoute);

  protected readonly commitmentId =
    this.route.snapshot.paramMap.get(RouteParam.CommitmentId) ?? '';
  protected readonly status = CommitmentStatus.Draft;
}
