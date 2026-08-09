import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { CHECK_IN_CLAIMED_RESULT_LABELS } from '../../../constants/check-in-claimed-result-labels';
import { CheckInClaimedResult } from '../../../constants/check-in-claimed-results';
import { CHECK_IN_STATUS_LABELS } from '../../../constants/check-in-status-labels';
import { CheckInStatus } from '../../../constants/check-in-statuses';
import { DueCheckInStatus } from '../../../constants/due-check-in-statuses';
import { CheckInFormValue } from '../../../models/check-in-form-value.model';
import { DueCheckIn } from '../../../models/due-check-in.model';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { CheckInEvidenceList } from '../check-in-evidence-list/check-in-evidence-list';
import { CheckInSubmitForm } from '../check-in-submit-form/check-in-submit-form';

@Component({
  selector: 'app-check-in-list',
  imports: [
    CardModule,
    CheckInEvidenceList,
    CheckInSubmitForm,
    DatePipe,
    EmptyState,
    TagModule,
  ],
  templateUrl: './check-in-list.html',
  styleUrl: './check-in-list.scss',
})
export class CheckInList {
  @Input() checkIns: DueCheckIn[] = [];
  @Input() emptyTitle = 'No check-ins';
  @Input() emptyMessage = 'Check-ins will appear here.';
  @Input() isSubmitting = false;
  @Input() showSubmitForm = false;

  @Output() submitted = new EventEmitter<{
    checkIn: DueCheckIn;
    value: CheckInFormValue;
  }>();

  protected readonly checkInStatus = CheckInStatus;
  protected readonly claimedResultLabels = CHECK_IN_CLAIMED_RESULT_LABELS;
  protected readonly checkInStatusLabels = CHECK_IN_STATUS_LABELS;

  protected statusLabel(checkIn: DueCheckIn): string {
    if (checkIn.status === DueCheckInStatus.AwaitingSubmission) {
      return 'Awaiting submission';
    }

    if (checkIn.status === DueCheckInStatus.Missed) {
      return 'Missed';
    }

    return this.checkInStatusLabels[checkIn.status];
  }

  protected claimedResultLabel(result: CheckInClaimedResult): string {
    return this.claimedResultLabels[result];
  }

  protected claimedResultSeverity(
    result: CheckInClaimedResult,
  ): 'success' | 'danger' {
    return result === CheckInClaimedResult.Passed ? 'success' : 'danger';
  }
}
