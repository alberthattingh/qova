import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TagModule } from 'primeng/tag';

import { CheckIn } from '../../../models/check-in.model';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { CheckInEvidenceList } from '../../check-ins/check-in-evidence-list/check-in-evidence-list';

@Component({
  selector: 'app-check-in-history',
  imports: [CheckInEvidenceList, DatePipe, EmptyState, TagModule, TitleCasePipe],
  templateUrl: './check-in-history.html',
  styleUrl: './check-in-history.scss',
})
export class CheckInHistory {
  @Input() checkIns: CheckIn[] = [];
}
