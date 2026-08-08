import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, Input } from '@angular/core';

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
}
