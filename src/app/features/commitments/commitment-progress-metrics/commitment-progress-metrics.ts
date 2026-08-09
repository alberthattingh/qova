import { Component, Input } from '@angular/core';
import { TagModule } from 'primeng/tag';

import { CommitmentProgressMetrics } from '../../../models/commitment-progress-metrics.model';

@Component({
  selector: 'app-commitment-progress-metrics',
  imports: [TagModule],
  templateUrl: './commitment-progress-metrics.html',
  styleUrl: './commitment-progress-metrics.scss',
})
export class CommitmentProgressMetricsComponent {
  @Input({ required: true }) metrics!: CommitmentProgressMetrics;

  protected rateLabel(rate: number | null): string {
    return rate === null ? 'No resolved check-ins' : `${Math.round(rate * 100)}%`;
  }

  protected complianceLabel(rate: number | null): string {
    return rate === null ? 'No reports due' : `${Math.round(rate * 100)}%`;
  }
}
