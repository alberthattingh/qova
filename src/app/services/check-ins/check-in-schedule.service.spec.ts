import { CheckInFrequency } from '../../constants/check-in-frequency';
import { CheckInStatus } from '../../constants/check-in-statuses';
import { CheckIn } from '../../models/check-in.model';
import { CheckInScheduleInput } from '../../models/check-in-schedule-input.model';
import { CheckInScheduleService } from './check-in-schedule.service';

describe('CheckInScheduleService', () => {
  let service: CheckInScheduleService;

  beforeEach(() => {
    service = new CheckInScheduleService();
  });

  it('calculates the current daily period and deadline', () => {
    const schedule = scheduleInput(CheckInFrequency.Daily);
    const period = service.currentPeriod(
      schedule,
      new Date('2026-08-08T08:00:00.000Z'),
    );

    expect(period?.startsAt.toISOString()).toBe('2026-08-08T00:00:00.000Z');
    expect(period?.endsAt.toISOString()).toBe('2026-08-08T23:59:59.999Z');
    expect(period?.deadline.toISOString()).toBe('2026-08-08T09:00:00.000Z');
  });

  it('represents an unpersisted current period as awaiting submission before deadline', () => {
    const state = service.currentPeriodSubmissionState(
      scheduleInput(CheckInFrequency.Daily),
      [],
      new Date('2026-08-08T08:00:00.000Z'),
    );

    expect(state?.persistedCheckIn).toBeNull();
    expect(state?.isAwaitingSubmission).toBe(true);
    expect(state?.isOverdue).toBe(false);
  });

  it('matches a persisted check-in to its period without generating future documents', () => {
    const checkIn: CheckIn = {
      id: 'check-in-1',
      commitmentId: 'commitment-1',
      ownerUserId: 'owner-1',
      managerUserIds: ['manager-1'],
      userId: 'owner-1',
      periodIndex: 7,
      periodStartsAt: new Date('2026-08-08T00:00:00.000Z'),
      periodEndsAt: new Date('2026-08-08T23:59:59.999Z'),
      deadline: new Date('2026-08-08T09:00:00.000Z'),
      claimedResult: 'Done',
      comment: null,
      evidence: [],
      wasMissed: false,
      dueAt: new Date('2026-08-08T09:00:00.000Z'),
      missedAt: null,
      status: CheckInStatus.Submitted,
      submittedAt: new Date('2026-08-08T08:30:00.000Z'),
    };
    const state = service.currentPeriodSubmissionState(
      scheduleInput(CheckInFrequency.Daily),
      [checkIn],
      new Date('2026-08-08T08:45:00.000Z'),
    );

    expect(state?.persistedCheckIn).toBe(checkIn);
    expect(state?.isAwaitingSubmission).toBe(false);
  });

  it('calculates previous and next weekly periods', () => {
    const schedule = scheduleInput(CheckInFrequency.Weekly);
    const state = service.scheduleState(
      schedule,
      new Date('2026-08-12T12:00:00.000Z'),
    );

    expect(state.currentPeriod?.startsAt.toISOString()).toBe(
      '2026-08-08T00:00:00.000Z',
    );
    expect(state.previousPeriod?.startsAt.toISOString()).toBe(
      '2026-08-01T00:00:00.000Z',
    );
    expect(state.nextPeriod?.startsAt.toISOString()).toBe(
      '2026-08-15T00:00:00.000Z',
    );
    expect(state.currentPeriod?.deadline.toISOString()).toBe(
      '2026-08-14T09:00:00.000Z',
    );
  });

  it('marks a period overdue after its deadline', () => {
    const period = service.currentPeriod(
      scheduleInput(CheckInFrequency.Weekly),
      new Date('2026-08-14T10:00:00.000Z'),
    );

    expect(period).not.toBeNull();
    expect(
      service.isPeriodOverdue(period!, new Date('2026-08-14T10:00:00.000Z')),
    ).toBe(true);
  });

  it('calculates monthly deadlines from the schedule source of truth', () => {
    const period = service.currentPeriod(
      {
        ...scheduleInput(CheckInFrequency.Monthly),
        startDate: new Date('2026-01-15T00:00:00.000Z'),
      },
      new Date('2026-02-20T12:00:00.000Z'),
    );

    expect(period?.startsAt.toISOString()).toBe('2026-02-15T00:00:00.000Z');
    expect(period?.deadline.toISOString()).toBe('2026-03-14T09:00:00.000Z');
  });
});

function scheduleInput(
  checkInFrequency: CheckInFrequency,
): CheckInScheduleInput {
  return {
    startDate: new Date('2026-08-01T00:00:00.000Z'),
    endDate: null,
    checkInFrequency,
    checkInTime: '09:00',
    timeZone: 'UTC',
  };
}
