import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

import { CheckInStatus } from "../constants/check-in-statuses";
import { CommitmentStatus } from "../constants/commitment-statuses";
import { FirebaseCollection } from "../constants/firebase-collections";
import { CheckInScheduleInput } from "../models/check-in-schedule-input.model";
import { Commitment, PersistedCommitment } from "../models/commitment.model";
import { CheckInScheduleService } from "./check-in-schedule.service";

const PROCESS_LIMIT = 100;

export class MissedCheckInService {
  private readonly firestore = getFirestore();
  private readonly schedules = new CheckInScheduleService();

  async processDueCommitments(now = new Date()): Promise<number> {
    const dueCommitments = await this.firestore
      .collection(FirebaseCollection.Commitments)
      .where("status", "==", CommitmentStatus.Active)
      .where("nextCheckInAt", "<=", Timestamp.fromDate(now))
      .limit(PROCESS_LIMIT)
      .get();

    await Promise.all(
      dueCommitments.docs.map((snapshot) =>
        this.processCommitment(snapshot.ref, now),
      ),
    );

    return dueCommitments.size;
  }

  private async processCommitment(
    commitmentReference: FirebaseFirestore.DocumentReference,
    now: Date,
  ): Promise<void> {
    await this.firestore.runTransaction(async (transaction) => {
      const commitmentSnapshot = await transaction.get(commitmentReference);

      if (!commitmentSnapshot.exists) {
        return;
      }

      const commitment = this.toCommitment(
        commitmentSnapshot.data() as PersistedCommitment,
      );

      if (
        commitment.status !== CommitmentStatus.Active ||
        !commitment.nextCheckInAt ||
        commitment.nextCheckInAt.getTime() > now.getTime()
      ) {
        return;
      }

      const schedule = this.scheduleInput(commitment);
      const duePeriod = this.schedules.periodForDeadline(
        schedule,
        commitment.nextCheckInAt,
      );

      if (!duePeriod) {
        transaction.update(commitmentReference, {
          nextCheckInAt: null,
          updatedAt: Timestamp.fromDate(now),
        });
        return;
      }

      const checkInId = `${commitment.id}_${duePeriod.index}`;
      const checkInReference = this.firestore
        .collection(FirebaseCollection.CheckIns)
        .doc(checkInId);
      const checkInSnapshot = await transaction.get(checkInReference);

      if (!checkInSnapshot.exists) {
        transaction.set(checkInReference, {
          id: checkInId,
          commitmentId: commitment.id,
          ownerUserId: commitment.ownerUserId,
          managerUserIds: commitment.managerUserIds,
          userId: commitment.ownerUserId,
          periodIndex: duePeriod.index,
          periodStartsAt: Timestamp.fromDate(duePeriod.startsAt),
          periodEndsAt: Timestamp.fromDate(duePeriod.endsAt),
          deadline: Timestamp.fromDate(duePeriod.deadline),
          claimedResult: null,
          comment: null,
          wasMissed: true,
          isLate: false,
          dueAt: Timestamp.fromDate(commitment.nextCheckInAt),
          missedAt: Timestamp.fromDate(now),
          status: CheckInStatus.Missed,
          submittedAt: null,
        });
      }

      const nextCheckInAt = this.schedules.nextCheckInDeadlineAfterPeriod(
        schedule,
        duePeriod,
      );

      transaction.update(commitmentReference, {
        nextCheckInAt: nextCheckInAt ? Timestamp.fromDate(nextCheckInAt) : null,
        updatedAt: Timestamp.fromDate(now),
      });
    });
  }

  private scheduleInput(commitment: Commitment): CheckInScheduleInput {
    return {
      startDate: commitment.startDate,
      endDate: commitment.endDate,
      checkInFrequency: commitment.checkInFrequency,
      checkInTime: commitment.checkInTime,
      timeZone: commitment.timeZone,
    };
  }

  private toCommitment(value: PersistedCommitment): Commitment {
    return {
      id: value.id,
      ownerUserId: value.ownerUserId,
      managerUserIds: value.managerUserIds,
      startDate: value.startDate.toDate(),
      endDate: value.endDate ? value.endDate.toDate() : null,
      checkInFrequency: value.checkInFrequency,
      checkInTime: value.checkInTime,
      timeZone: value.timeZone,
      status: value.status,
      nextCheckInAt: value.nextCheckInAt ? value.nextCheckInAt.toDate() : null,
    };
  }
}

export async function processMissedCheckIns(): Promise<void> {
  const service = new MissedCheckInService();
  const processedCount = await service.processDueCommitments();

  logger.info("Processed missed check-ins", { processedCount });
}
