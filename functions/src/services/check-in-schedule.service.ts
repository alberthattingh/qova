import { CheckInFrequency } from "../constants/check-in-frequency";
import { CheckInPeriod } from "../models/check-in-period.model";
import { CheckInScheduleInput } from "../models/check-in-schedule-input.model";

const CHECK_IN_TIME_SEPARATOR = ":";
const DEFAULT_CHECK_IN_HOUR = 9;
const DEFAULT_CHECK_IN_MINUTE = 0;
const PERIOD_START_HOUR = 0;
const PERIOD_START_MINUTE = 0;
const LAST_MILLISECOND_OF_DAY = 1;
const PERIOD_SEARCH_WINDOW = 3;

interface CalendarDateParts {
  year: number;
  month: number;
  day: number;
}

interface CheckInTimeParts {
  hour: number;
  minute: number;
}

export class CheckInScheduleService {
  nextCheckInDeadlineAfterPeriod(
    schedule: CheckInScheduleInput,
    period: CheckInPeriod,
  ): Date | null {
    return this.periodByIndex(schedule, period.index + 1)?.deadline ?? null;
  }

  periodForDeadline(
    schedule: CheckInScheduleInput,
    dueAt: Date,
  ): CheckInPeriod | null {
    const startParts = this.dateParts(schedule.startDate, schedule.timeZone);
    const dueParts = this.dateParts(dueAt, schedule.timeZone);
    const baseIndex = this.periodIndexForDate(schedule, startParts, dueParts);

    for (
      let index = Math.max(0, baseIndex - PERIOD_SEARCH_WINDOW);
      index <= baseIndex + PERIOD_SEARCH_WINDOW;
      index += 1
    ) {
      const period = this.periodByIndex(schedule, index);

      if (period && period.deadline.getTime() === dueAt.getTime()) {
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

  private checkInTimeParts(checkInTime: string): CheckInTimeParts {
    const [hour, minute] = checkInTime
      .split(CHECK_IN_TIME_SEPARATOR)
      .map((value) => Number(value));

    return {
      hour: Number.isInteger(hour) ? hour : DEFAULT_CHECK_IN_HOUR,
      minute: Number.isInteger(minute) ? minute : DEFAULT_CHECK_IN_MINUTE,
    };
  }

  private dateParts(date: Date, timeZone: string): CalendarDateParts {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(date);

    return {
      year: Number(this.datePart(parts, "year")),
      month: Number(this.datePart(parts, "month")),
      day: Number(this.datePart(parts, "day")),
    };
  }

  private datePart(
    parts: Intl.DateTimeFormatPart[],
    type: Intl.DateTimeFormatPartTypes,
  ): string {
    return parts.find((part) => part.type === type)?.value ?? "0";
  }

  private zonedDateTimeToUtc(
    dateParts: CalendarDateParts,
    hour: number,
    minute: number,
    timeZone: string,
  ): Date {
    const utcGuess = new Date(
      Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, hour, minute),
    );
    const offset = this.timeZoneOffset(utcGuess, timeZone);

    return new Date(utcGuess.getTime() - offset);
  }

  private timeZoneOffset(date: Date, timeZone: string): number {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const zonedUtc = Date.UTC(
      Number(this.datePart(parts, "year")),
      Number(this.datePart(parts, "month")) - 1,
      Number(this.datePart(parts, "day")),
      Number(this.datePart(parts, "hour")),
      Number(this.datePart(parts, "minute")),
      Number(this.datePart(parts, "second")),
    );

    return zonedUtc - date.getTime();
  }

  private addDays(dateParts: CalendarDateParts, days: number): CalendarDateParts {
    const date = new Date(
      Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day + days),
    );

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
    const target = new Date(
      Date.UTC(dateParts.year, dateParts.month - 1 + months, 1),
    );
    const lastDay = new Date(
      Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
    ).getUTCDate();

    return {
      year: target.getUTCFullYear(),
      month: target.getUTCMonth() + 1,
      day: Math.min(dateParts.day, lastDay),
    };
  }

  private daysBetween(start: CalendarDateParts, end: CalendarDateParts): number {
    const startUtc = Date.UTC(start.year, start.month - 1, start.day);
    const endUtc = Date.UTC(end.year, end.month - 1, end.day);

    return Math.floor((endUtc - startUtc) / 86_400_000);
  }
}
