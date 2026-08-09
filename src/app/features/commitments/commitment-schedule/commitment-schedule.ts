import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, Input } from '@angular/core';

import { DATE_FORMATS } from '../../../constants/date-formats';
import { Commitment } from '../../../models/commitment.model';
import { CommitmentVersion } from '../../../models/commitment-version.model';

@Component({
  selector: 'app-commitment-schedule',
  imports: [DatePipe, TitleCasePipe],
  templateUrl: './commitment-schedule.html',
  styleUrl: './commitment-schedule.scss',
})
export class CommitmentSchedule {
  @Input({ required: true }) commitment!: Commitment | CommitmentVersion;
  @Input() currentPeriodDeadline: Date | null = null;
  @Input() nextCheckInDeadline: Date | null = null;
  @Input() isCurrentPeriodOverdue = false;

  protected readonly DATE_FORMATS = DATE_FORMATS;
}
