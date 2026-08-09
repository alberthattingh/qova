import { NgStyle } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TagModule } from 'primeng/tag';

import { CommitmentProgressMetrics } from '../../../models/commitment-progress-metrics.model';

@Component({
  selector: 'app-commitment-progress-metrics',
  imports: [NgStyle, TagModule],
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

  protected goalChartStyle(): Record<string, string> {
    return this.pieStyle([
      { value: this.metrics.goal.passed, color: 'var(--qova-success)' },
      { value: this.metrics.goal.failed, color: 'var(--qova-danger)' },
      { value: this.metrics.goal.unresolved, color: 'var(--qova-info)' },
    ]);
  }

  protected reportingChartStyle(): Record<string, string> {
    return this.pieStyle([
      {
        value: this.metrics.reporting.submittedOnTime,
        color: 'var(--qova-success)',
      },
      {
        value: this.metrics.reporting.submittedLate,
        color: 'var(--qova-warning)',
      },
      { value: this.metrics.reporting.missed, color: 'var(--qova-danger)' },
    ]);
  }

  private pieStyle(
    segments: { value: number; color: string }[],
  ): Record<string, string> {
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);

    if (total === 0) {
      return {
        background:
          'conic-gradient(var(--qova-border) 0 100%)',
      };
    }

    let cursor = 0;
    const stops = segments.map((segment) => {
      const start = cursor;
      cursor += (segment.value / total) * 100;

      return `${segment.color} ${start}% ${cursor}%`;
    });

    return {
      background: `conic-gradient(${stops.join(', ')})`,
    };
  }
}
