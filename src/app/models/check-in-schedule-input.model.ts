import { CheckInFrequency } from '../constants/check-in-frequency';

export interface CheckInScheduleInput {
  startDate: Date;
  endDate: Date | null;
  checkInFrequency: CheckInFrequency;
  checkInTime: string;
  timeZone: string;
}
