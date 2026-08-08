import { Component } from '@angular/core';
import { TagModule } from 'primeng/tag';

import { CheckInStatus } from '../../../constants/check-in-statuses';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-check-ins-page',
  imports: [EmptyState, TagModule],
  templateUrl: './check-ins-page.html',
  styleUrl: './check-ins-page.scss',
})
export class CheckInsPage {
  protected readonly status = CheckInStatus.Pending;
}
