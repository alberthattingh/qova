import { DueCheckIn } from './due-check-in.model';

export interface CheckInDashboard {
  dueCheckIns: DueCheckIn[];
  managedCheckIns: DueCheckIn[];
}
