import { Injectable } from '@angular/core';

import { CheckInFrequency } from '../../constants/check-in-frequency';
import { CheckInPeriod } from '../../models/check-in-period.model';
import { CheckInPeriodSubmissionState } from '../../models/check-in-period-submission-state.model';
import { CheckInScheduleInput } from '../../models/check-in-schedule-input.model';
import { CheckInScheduleState } from '../../models/check-in-schedule-state.model';
import { CheckIn } from '../../models/check-in.model';

const CHECK_IN_TIME_SEPARATOR = ':';
const DEFAULT_CHECK_IN_HOUR = 9;
const DEFAULT_CHECK_IN_MINUTE = 0;
const PERIOD_START_HOUR = 0;
const PERIOD_START_MINUTE = 0;
const LAST_MILLISECOND_OF_DAY = 1;

interface CalendarDateParts {
  year: number;
  month: number;
  day: number;
}

interface CheckInTimeParts {
  hour: number;
  minute: number;
}

@Injectable({
  providedIn: 'root',
})
export class CheckInScheduleService {
  currentPeriod(
    schedule: CheckInScheduleInput,
    now = new Date(),
  ): CheckInPeriod | null {
    return this.scheduleState(schedule, now).currentPeriod;
  }

  previousPeriod(
    schedule: CheckInScheduleInput,
    now = new Date(),
  ): CheckInPeriod | null {
    return this.scheduleState(schedule, now).previousPeriod;
  }

  nextPeriod(
    schedule: CheckInScheduleInput,
    now = new Date(),
  ): CheckInPeriod | null {
    return this.scheduleState(schedule, now).nextPeriod;
  }

  periodDeadline(
    schedule: CheckInScheduleInput,
    period: CheckInPeriod,
  ): Date {
    return this.deadlineForPeriod(schedule, period);
  }

  isPeriodOverdue(period: CheckInPeriod, now = new Date()): boolean {
    return now.getTime() > period.deadline.getTime();
  }

  nextCheckInDeadline(
    schedule: CheckInScheduleInput,
    now = new Date(),
  ): Date | null {
    return this.scheduleState(schedule, now).nextCheckInDeadline;
  }

  scheduleState(
    schedule: CheckInScheduleInput,
    now = new Date(),
  ): CheckInScheduleState {
    const currentPeriod = this.currentPeriodForDate(schedule, now);
    const previousPeriod = currentPeriod
      ? this.periodByIndex(schedule, currentPeriod.index - 1)
      : this.lastPeriodBefore(schedule, now);
    const nextPeriod = currentPeriod
      ? this.periodByIndex(schedule, currentPeriod.index + 1)
      : this.firstPeriodAfter(schedule, now);

    return {
      currentPeriod,
      previousPeriod,
      nextPeriod,
      nextCheckInDeadline: currentPeriod?.deadline ?? nextPeriod?.deadline ?? null,
    };
  }

  currentPeriodSubmissionState(
    schedule: CheckInScheduleInput,
    persistedCheckIns: CheckIn[],
    now = new Date(),
  ): CheckInPeriodSubmissionState | null {
    const period = this.currentPeriod(schedule, now);

    if (!period) {
      return null;
    }

    const persistedCheckIn = this.checkInForPeriod(persistedCheckIns, period);
    const isOverdue = this.isPeriodOverdue(period, now);

    return {
      period,
      persistedCheckIn,
      isAwaitingSubmission: !persistedCheckIn && !isOverdue,
      isOverdue,
    };
  }

  private currentPeriodForDate(
    schedule: CheckInScheduleInput,
    now: Date,
  ): CheckInPeriod | null {
    const startParts = this.dateParts(schedule.startDate, schedule.timeZone);
    const nowParts = this.dateParts(now, schedule.timeZone);
    const index = this.periodIndexForDate(schedule, startParts, nowParts);

    if (index < 0) {
      return null;
    }

    const period = this.periodByIndex(schedule, index);

    if (!period) {
      return null;
    }

    if (
      now.getTime() < period.startsAt.getTime() ||
      now.getTime() > period.endsAt.getTime()
    ) {
      return null;
    }

    return period;
  }

  private firstPeriodAfter(
    schedule: CheckInScheduleInput,
    date: Date,
  ): CheckInPeriod | null {
    const startParts = this.dateParts(schedule.startDate, schedule.timeZone);
    const dateParts = this.dateParts(date, schedule.timeZone);
    const baseIndex = Math.max(
      0,
      this.periodIndexForDate(schedule, startParts, dateParts),
    );

    for (let index = baseIndex; index <= baseIndex + 1; index += 1) {
      const period = this.periodByIndex(schedule, index);

      if (period && period.startsAt.getTime() > date.getTime()) {
        return period;
      }
    }

    return null;
  }

  private lastPeriodBefore(
    schedule: CheckInScheduleInput,
    date: Date,
  ): CheckInPeriod | null {
    const startParts = this.dateParts(schedule.startDate, schedule.timeZone);
    const dateParts = this.dateParts(date, schedule.timeZone);
    const baseIndex = this.periodIndexForDate(schedule, startParts, dateParts);

    for (let index = baseIndex; index >= 0; index -= 1) {
      const period = this.periodByIndex(schedule, index);

      if (period && period.endsAt.getTime() < date.getTime()) {
        return period;
      }
    }

    return null;
  }

  private periodByIndex(
    schedule: CheckInScheduleInput,
    index: number,
  ): CheckInPeriod | null {
    if (index < 0) {
      return null;
    }

    const startParts = this.dateParts(schedule.startDate, schedule.timeZone);
    const periodStart = this.periodStartParts(schedule, startParts, index);
    const nextPeriodStart = this.periodStartParts(schedule, startParts, index + 1);
    const endLimit = schedule.endDate
      ? this.endOfDate(schedule.endDate, schedule.timeZone)
      : null;
    const startsAt = this.zonedDateTimeToUtc(
      periodStart,
      PERIOD_START_HOUR,
      PERIOD_START_MINUTE,
      schedule.timeZone,
    );
    const naturalEndsAt = new Date(
      this.zonedDateTimeToUtc(
        nextPeriodStart,
        PERIOD_START_HOUR,
        PERIOD_START_MINUTE,
        schedule.timeZone,
      ).getTime() - LAST_MILLISECOND_OF_DAY,
    );
    const endsAt =
      endLimit && endLimit.getTime() < naturalEndsAt.getTime()
        ? endLimit
        : naturalEndsAt;

    if (startsAt.getTime() > endsAt.getTime()) {
      return null;
    }

    return {
      index,
      startsAt,
      endsAt,
      deadline: this.deadlineForPeriodParts(schedule, periodStart, endsAt),
    };
  }

  private deadlineForPeriod(
    schedule: CheckInScheduleInput,
    period: CheckInPeriod,
  ): Date {
    const periodStart = this.dateParts(period.startsAt, schedule.timeZone);

    return this.deadlineForPeriodParts(schedule, periodStart, period.endsAt);
  }

  private deadlineForPeriodParts(
    schedule: CheckInScheduleInput,
    periodStart: CalendarDateParts,
    periodEndsAt: Date,
  ): Date {
    const checkInTime = this.checkInTimeParts(schedule.checkInTime);
    const deadlineDate = this.deadlineDateParts(schedule, periodStart);
    const deadline = this.zonedDateTimeToUtc(
      deadlineDate,
      checkInTime.hour,
      checkInTime.minute,
      schedule.timeZone,
    );

    return deadline.getTime() > periodEndsAt.getTime() ? periodEndsAt : deadline;
  }

  private deadlineDateParts(
    schedule: CheckInScheduleInput,
    periodStart: CalendarDateParts,
  ): CalendarDateParts {
    if (schedule.checkInFrequency === CheckInFrequency.Daily) {
      return periodStart;
    }

    if (schedule.checkInFrequency === CheckInFrequency.Weekly) {
      return this.addDays(periodStart, 6);
    }

    const nextMonth = this.addMonths(periodStart, 1);

    return this.addDays(nextMonth, -1);
  }

  private periodIndexForDate(
    schedule: CheckInScheduleInput,
    startParts: CalendarDateParts,
    dateParts: CalendarDateParts,
  ): number {
    if (schedule.checkInFrequency === CheckInFrequency.Daily) {
      return this.daysBetween(startParts, dateParts);
    }

    if (schedule.checkInFrequency === CheckInFrequency.Weekly) {
      return Math.floor(this.daysBetween(startParts, dateParts) / 7);
    }

    return (
      (dateParts.year - startParts.year) * 12 +
      dateParts.month -
      startParts.month -
      (dateParts.day < startParts.day ? 1 : 0)
    );
  }

  private periodStartParts(
    schedule: CheckInScheduleInput,
    startParts: CalendarDateParts,
    index: number,
  ): CalendarDateParts {
    if (schedule.checkInFrequency === CheckInFrequency.Daily) {
      return this.addDays(startParts, index);
    }

    if (schedule.checkInFrequency === CheckInFrequency.Weekly) {
      return this.addDays(startParts, index * 7);
    }

    return this.addMonths(startParts, index);
  }

  private checkInForPeriod(
    checkIns: CheckIn[],
    period: CheckInPeriod,
  ): CheckIn | null {
    return (
      checkIns.find((checkIn) => {
        if (!checkIn.submittedAt) {
          return false;
        }

        return (
          checkIn.submittedAt.getTime() >= period.startsAt.getTime() &&
          checkIn.submittedAt.getTime() <= period.endsAt.getTime()
        );
      }) ?? null
    );
  }

  private endOfDate(date: Date, timeZone: string): Date {
    const dateParts = this.dateParts(date, timeZone);
    const nextDay = this.addDays(dateParts, 1);

    return new Date(
      this.zonedDateTimeToUtc(
        nextDay,
        PERIOD_START_HOUR,
        PERIOD_START_MINUTE,
        timeZone,
      ).getTime() - LAST_MILLISECOND_OF_DAY,
    );
  }

  private addDays(
    dateParts: CalendarDateParts,
    days: number,
  ): CalendarDateParts {
    const date = new Date(Date.UTC(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day + days,
    ));

    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    };
  }

  private addMonths(
    dateParts: CalendarDateParts,
    months: number,
  ): CalendarDateParts {
    const targetMonthIndex = dateParts.month - 1 + months;
    const targetYear = dateParts.year + Math.floor(targetMonthIndex / 12);
    const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
    const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();

    return {
      year: targetYear,
      month: targetMonth + 1,
      day: Math.min(dateParts.day, lastDay),
    };
  }

  private daysBetween(
    startParts: CalendarDateParts,
    endParts: CalendarDateParts,
  ): number {
    const start = Date.UTC(startParts.year, startParts.month - 1, startParts.day);
    const end = Date.UTC(endParts.year, endParts.month - 1, endParts.day);

    return Math.floor((end - start) / 86_400_000);
  }

  private dateParts(date: Date, timeZone: string): CalendarDateParts {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    return {
      year: this.numberPart(parts, 'year'),
      month: this.numberPart(parts, 'month'),
      day: this.numberPart(parts, 'day'),
    };
  }

  private zonedDateTimeToUtc(
    dateParts: CalendarDateParts,
    hour: number,
    minute: number,
    timeZone: string,
  ): Date {
    const utcGuess = Date.UTC(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      hour,
      minute,
    );
    const zonedParts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(new Date(utcGuess));
    const zonedAsUtc = Date.UTC(
      this.numberPart(zonedParts, 'year'),
      this.numberPart(zonedParts, 'month') - 1,
      this.numberPart(zonedParts, 'day'),
      this.numberPart(zonedParts, 'hour'),
      this.numberPart(zonedParts, 'minute'),
    );

    return new Date(utcGuess - (zonedAsUtc - utcGuess));
  }

  private checkInTimeParts(value: string): CheckInTimeParts {
    const [hour, minute] = value.split(CHECK_IN_TIME_SEPARATOR).map(Number);

    return {
      hour: Number.isFinite(hour) ? hour : DEFAULT_CHECK_IN_HOUR,
      minute: Number.isFinite(minute) ? minute : DEFAULT_CHECK_IN_MINUTE,
    };
  }

  private numberPart(
    parts: Intl.DateTimeFormatPart[],
    type: Intl.DateTimeFormatPartTypes,
  ): number {
    const value = parts.find((part) => part.type === type)?.value;

    if (!value) {
      throw new Error(`Missing date part ${type}`);
    }

    return Number(value);
  }
}
