import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  Timestamp,
  collection,
  doc,
  getDoc,
  writeBatch,
} from '@angular/fire/firestore';

import { CheckInClaimedResult } from '../../constants/check-in-claimed-results';
import { CheckInReviewDecision } from '../../constants/check-in-review-decisions';
import { CheckInStatus } from '../../constants/check-in-statuses';
import { FirebaseCollection } from '../../constants/firebase-collections';
import { CheckIn } from '../../models/check-in.model';
import { ReviewCheckInRequest } from '../../models/review-check-in-request.model';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class CheckInReviewService {
  private readonly auth = inject(AuthService);
  private readonly firestore = inject(Firestore);

  async reviewCheckIn(request: ReviewCheckInRequest): Promise<void> {
    const reviewerUserId = await this.auth.currentUserId();
    const checkIn = await this.checkInSnapshot(request.checkInId);

    if (!checkIn.managerUserIds.includes(reviewerUserId)) {
      throw new Error('Only an assigned sponsor may review this check-in');
    }

    if (checkIn.status !== CheckInStatus.Submitted) {
      throw new Error('Only submitted check-ins can be reviewed');
    }

    const reviewReference = doc(
      collection(this.firestore, FirebaseCollection.Reviews),
    );
    const timestamp = Timestamp.now();
    const batch = writeBatch(this.firestore);

    batch.set(reviewReference, {
      id: reviewReference.id,
      checkInId: checkIn.id,
      commitmentId: checkIn.commitmentId,
      ownerUserId: checkIn.ownerUserId,
      managerUserIds: checkIn.managerUserIds,
      reviewerUserId,
      decision: request.decision,
      comment: request.comment?.trim() || null,
      createdAt: timestamp,
    });
    batch.update(this.checkInRef(checkIn.id), {
      status: this.statusForDecision(request.decision),
    });

    await batch.commit();
  }

  private statusForDecision(decision: CheckInReviewDecision): CheckInStatus {
    if (decision === CheckInReviewDecision.Passed) {
      return CheckInStatus.Passed;
    }

    if (decision === CheckInReviewDecision.Failed) {
      return CheckInStatus.Failed;
    }

    return CheckInStatus.NeedsMoreEvidence;
  }

  private async checkInSnapshot(checkInId: string): Promise<CheckIn> {
    const snapshot = await getDoc(this.checkInRef(checkInId));

    if (!snapshot.exists()) {
      throw new Error('Check-in not found');
    }

    return this.toCheckIn(snapshot.data() as Record<string, unknown>);
  }

  private checkInRef(checkInId: string) {
    return doc(this.firestore, FirebaseCollection.CheckIns, checkInId);
  }

  private toCheckIn(value: Record<string, unknown>): CheckIn {
    return {
      id: this.toStringField(value, 'id'),
      commitmentId: this.toStringField(value, 'commitmentId'),
      ownerUserId: this.toStringField(value, 'ownerUserId'),
      managerUserIds: this.toStringArray(value['managerUserIds']),
      userId: this.toStringField(value, 'userId'),
      periodIndex: this.toNumberField(value, 'periodIndex'),
      periodStartsAt: this.toDate(value['periodStartsAt']),
      periodEndsAt: this.toDate(value['periodEndsAt']),
      deadline: this.toDate(value['deadline']),
      claimedResult: this.toNullableCheckInClaimedResult(value['claimedResult']),
      comment: this.toNullableString(value['comment']),
      evidence: [],
      wasMissed: this.toBooleanField(value, 'wasMissed'),
      isLate: this.toBooleanField(value, 'isLate'),
      dueAt: this.toDate(value['dueAt']),
      missedAt: this.toNullableDate(value['missedAt']),
      status: this.toCheckInStatus(value['status']),
      submittedAt: this.toNullableDate(value['submittedAt']),
      reviews: [],
    };
  }

  private toCheckInStatus(value: unknown): CheckInStatus {
    if (
      value === CheckInStatus.Submitted ||
      value === CheckInStatus.Missed ||
      value === CheckInStatus.Passed ||
      value === CheckInStatus.Failed ||
      value === CheckInStatus.NeedsMoreEvidence
    ) {
      return value;
    }

    throw new Error('Invalid check-in status');
  }

  private toCheckInClaimedResult(value: unknown): CheckInClaimedResult {
    if (
      value === CheckInClaimedResult.Passed ||
      value === CheckInClaimedResult.Failed
    ) {
      return value;
    }

    throw new Error('Invalid claimed result');
  }

  private toNullableCheckInClaimedResult(
    value: unknown,
  ): CheckInClaimedResult | null {
    if (value === null) {
      return null;
    }

    return this.toCheckInClaimedResult(value);
  }

  private toStringField(value: Record<string, unknown>, fieldName: string): string {
    const fieldValue = value[fieldName];

    if (typeof fieldValue === 'string') {
      return fieldValue;
    }

    throw new Error(`Invalid string field ${fieldName}`);
  }

  private toNumberField(value: Record<string, unknown>, fieldName: string): number {
    const fieldValue = value[fieldName];

    if (typeof fieldValue === 'number') {
      return fieldValue;
    }

    throw new Error(`Invalid number field ${fieldName}`);
  }

  private toBooleanField(
    value: Record<string, unknown>,
    fieldName: string,
  ): boolean {
    const fieldValue = value[fieldName];

    if (typeof fieldValue === 'boolean') {
      return fieldValue;
    }

    throw new Error(`Invalid boolean field ${fieldName}`);
  }

  private toStringArray(value: unknown): string[] {
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      return value;
    }

    throw new Error('Invalid string array field');
  }

  private toNullableString(value: unknown): string | null {
    if (value === null) {
      return null;
    }

    if (typeof value === 'string') {
      return value;
    }

    throw new Error('Invalid nullable string field');
  }

  private toDate(value: unknown): Date {
    if (value instanceof Timestamp) {
      return value.toDate();
    }

    throw new Error('Invalid timestamp field');
  }

  private toNullableDate(value: unknown): Date | null {
    if (value === null) {
      return null;
    }

    return this.toDate(value);
  }
}
