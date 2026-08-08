import { Component, Input } from '@angular/core';

import { CheckInEvidenceFileCategory } from '../../../constants/check-in-evidence-file-types';
import { CheckInEvidence } from '../../../models/check-in-evidence.model';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-check-in-evidence-list',
  imports: [EmptyState],
  templateUrl: './check-in-evidence-list.html',
  styleUrl: './check-in-evidence-list.scss',
})
export class CheckInEvidenceList {
  @Input() evidence: CheckInEvidence[] = [];
  @Input() showEmptyState = false;

  protected readonly fileCategory = CheckInEvidenceFileCategory;

  protected fileSizeLabel(size: number): string {
    if (size < 1024 * 1024) {
      return `${Math.ceil(size / 1024)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }
}
