import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  Timestamp,
  collection,
  collectionData,
  query,
  where,
} from '@angular/fire/firestore';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';

import { ProfileImageSource } from '../../constants/avatar';
import { CheckInFrequency } from '../../constants/check-in-frequency';
import { CheckInStatus } from '../../constants/check-in-statuses';
import { CommitmentStatus } from '../../constants/commitment-statuses';
import { FirebaseCollection } from '../../constants/firebase-collections';
import { CheckInEvidence } from '../../models/check-in-evidence.model';
import { CheckIn } from '../../models/check-in.model';
import { CommitmentManager } from '../../models/commitment-manager.model';
import { Commitment } from '../../models/commitment.model';
import { ReviewQueueItem } from '../../models/review-queue-item.model';
import { ReviewQueue } from '../../models/review-queue.model';
import { UserProfile } from '../../models/user-profile.model';
import { AuthService } from '../auth/auth.service';
import { CheckInEvidenceService } from '../check-ins/check-in-evidence.service';

const ACTION_REQUIRED_PRIORITY = 0;
const INFORMATIONAL_PRIORITY = 1;

@Injectable({
  providedIn: 'root',
})
export class ReviewQueueService {
  private readonly auth = inject(AuthService);
  private readonly evidence = inject(CheckInEvidenceService);
  private readonly firestore = inject(Firestore);

  queue$(): Observable<ReviewQueue> {
    return this.auth.currentAuthSession$.pipe(
      switchMap((session) => {
        if (!session) {
          return of({ items: [], actionRequiredCount: 0 });
        }

        return combineLatest({
          checkIns: this.managerCheckIns$(session.id),
          commitments: this.managerCommitments$(session.id),
          evidence: this.evidence.evidenceForManager$(session.id),
          users: this.users$(),
        }).pipe(
          map(({ checkIns, commitments, evidence, users }) =>
            this.queueFromRecords(checkIns, commitments, evidence, users),
          ),
        );
      }),
    );
  }

  private managerCheckIns$(managerUserId: string): Observable<CheckIn[]> {
    const checkInsQuery = query(
      collection(this.firestore, FirebaseCollection.CheckIns),
      where('managerUserIds', 'array-contains', managerUserId),
    );

    return collectionData(checkInsQuery).pipe(
      map((checkIns) =>
        checkIns
          .map((checkIn) => this.toCheckIn(checkIn as Record<string, unknown>))
          .filter((checkIn) => this.isQueueStatus(checkIn.status)),
      ),
    );
  }

  private managerCommitments$(managerUserId: string): Observable<Commitment[]> {
    const commitmentsQuery = query(
      collection(this.firestore, FirebaseCollection.Commitments),
      where('managerUserIds', 'array-contains', managerUserId),
    );

    return collectionData(commitmentsQuery).pipe(
      map((commitments) =>
        commitments.map((commitment) =>
          this.toCommitment(commitment as Record<string, unknown>),
        ),
      ),
    );
  }

  private users$(): Observable<UserProfile[]> {
    return collectionData(collection(this.firestore, FirebaseCollection.Users)).pipe(
      map((users) =>
        users.map((user) => this.toUserProfile(user as Record<string, unknown>)),
      ),
    );
  }

  private queueFromRecords(
    checkIns: CheckIn[],
    commitments: Commitment[],
    evidence: CheckInEvidence[],
    users: UserProfile[],
  ): ReviewQueue {
    const commitmentMap = new Map(
      commitments.map((commitment) => [commitment.id, commitment]),
    );
    const userMap = new Map(users.map((user) => [user.id, user]));
    const items = checkIns
      .map((checkIn) => {
        const commitment = commitmentMap.get(checkIn.commitmentId);
        const user = userMap.get(checkIn.ownerUserId);

        if (!commitment || !user) {
          return null;
        }

        const checkInWithEvidence = {
          ...checkIn,
          evidence: evidence.filter((item) => item.checkInId === checkIn.id),
        };
        const requiresAction = checkIn.status === CheckInStatus.Submitted;

        return {
          id: checkIn.id,
          checkIn: checkInWithEvidence,
          commitment,
          user,
          requiresAction,
          priority: requiresAction
            ? ACTION_REQUIRED_PRIORITY
            : INFORMATIONAL_PRIORITY,
        };
      })
      .filter((item): item is ReviewQueueItem => item !== null)
      .sort((a, b) => this.compareQueueItems(a, b));

    return {
      items,
      actionRequiredCount: items.filter((item) => item.requiresAction).length,
    };
  }

  private compareQueueItems(a: ReviewQueueItem, b: ReviewQueueItem): number {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    return this.checkInSortDate(b.checkIn).getTime() -
      this.checkInSortDate(a.checkIn).getTime();
  }

  private isQueueStatus(status: CheckInStatus): boolean {
    return status === CheckInStatus.Submitted || status === CheckInStatus.Missed;
  }

  private checkInSortDate(checkIn: CheckIn): Date {
    return checkIn.submittedAt ?? checkIn.missedAt ?? checkIn.dueAt;
  }

  private toCommitment(value: Record<string, unknown>): Commitment {
    return {
      id: this.toStringField(value, 'id'),
      ownerUserId: this.toStringField(value, 'ownerUserId'),
      managerUserIds: this.toStringArray(value['managerUserIds']),
      managers: this.toManagers(value['managers']),
      title: this.toStringField(value, 'title'),
      description: this.toStringField(value, 'description'),
      targetDescription: this.toStringField(value, 'targetDescription'),
      evidenceInstructions: this.toStringField(value, 'evidenceInstructions'),
      startDate: this.toDate(value['startDate']),
      endDate: this.toNullableDate(value['endDate']),
      checkInFrequency: this.toCheckInFrequency(value['checkInFrequency']),
      checkInTime: this.toStringField(value, 'checkInTime'),
      timeZone: this.toStringField(value, 'timeZone'),
      status: this.toCommitmentStatus(value['status']),
      nextCheckInAt: this.toNullableDate(value['nextCheckInAt']),
      currentVersionId: this.toNullableString(value['currentVersionId']),
      currentVersionNumber: this.toNumberField(value, 'currentVersionNumber'),
      createdAt: this.toDate(value['createdAt']),
      updatedAt: this.toDate(value['updatedAt']),
    };
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
      claimedResult: this.toStringField(value, 'claimedResult'),
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

  private toUserProfile(value: Record<string, unknown>): UserProfile {
    return {
      id: this.toStringField(value, 'id'),
      displayName: this.toStringField(value, 'displayName'),
      email: this.toStringField(value, 'email'),
      profileImageUrl: this.toStringField(value, 'profileImageUrl'),
      profileImageSource: this.toProfileImageSource(value['profileImageSource']),
      createdAt: this.toDate(value['createdAt']),
      updatedAt: this.toDate(value['updatedAt']),
    };
  }

  private toManagers(value: unknown): CommitmentManager[] {
    if (!Array.isArray(value)) {
      throw new Error('Invalid commitment managers');
    }

    return value.map((manager) => {
      if (!this.isRecord(manager)) {
        throw new Error('Invalid commitment manager');
      }

      return {
        id: this.toStringField(manager, 'id'),
        displayName: this.toStringField(manager, 'displayName'),
        email: this.toStringField(manager, 'email'),
        profileImageUrl: this.toStringField(manager, 'profileImageUrl'),
      };
    });
  }

  private toCommitmentStatus(value: unknown): CommitmentStatus {
    if (
      value === CommitmentStatus.Draft ||
      value === CommitmentStatus.Active ||
      value === CommitmentStatus.Completed ||
      value === CommitmentStatus.Cancelled
    ) {
      return value;
    }

    throw new Error('Invalid commitment status');
  }

  private toCheckInFrequency(value: unknown): CheckInFrequency {
    if (
      value === CheckInFrequency.Daily ||
      value === CheckInFrequency.Weekly ||
      value === CheckInFrequency.Monthly
    ) {
      return value;
    }

    throw new Error('Invalid check-in frequency');
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

  private toProfileImageSource(value: unknown): ProfileImageSource {
    if (
      value === ProfileImageSource.Generated ||
      value === ProfileImageSource.Uploaded
    ) {
      return value;
    }

    throw new Error('Invalid user profile image source');
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

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
