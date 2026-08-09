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

import { CheckInClaimedResult } from '../../constants/check-in-claimed-results';
import { CheckInFrequency } from '../../constants/check-in-frequency';
import { CheckInReviewDecision } from '../../constants/check-in-review-decisions';
import { CheckInStatus } from '../../constants/check-in-statuses';
import { CommitmentStatus } from '../../constants/commitment-statuses';
import { FirebaseCollection } from '../../constants/firebase-collections';
import { CheckInReview } from '../../models/check-in-review.model';
import { CheckIn } from '../../models/check-in.model';
import { CommitmentManager } from '../../models/commitment-manager.model';
import { Commitment } from '../../models/commitment.model';
import { DueCheckIn } from '../../models/due-check-in.model';
import { UserDashboardCommitmentProgress } from '../../models/user-dashboard-commitment-progress.model';
import { UserDashboardReviewResult } from '../../models/user-dashboard-review-result.model';
import { UserDashboard } from '../../models/user-dashboard.model';
import { AuthService } from '../auth/auth.service';
import { CheckInService } from '../check-ins/check-in.service';
import { CommitmentMetricsService } from '../commitments/commitment-metrics.service';

const RECENT_REVIEW_LIMIT = 5;

@Injectable({
  providedIn: 'root',
})
export class UserDashboardService {
  private readonly auth = inject(AuthService);
  private readonly checkIns = inject(CheckInService);
  private readonly firestore = inject(Firestore);
  private readonly metrics = inject(CommitmentMetricsService);

  dashboard$(): Observable<UserDashboard> {
    return this.auth.currentAuthSession$.pipe(
      switchMap((session) => {
        if (!session) {
          return of(this.emptyDashboard());
        }

        return combineLatest({
          checkInDashboard: this.checkIns.dashboard$(),
          commitments: this.ownerCommitments$(session.id),
          persistedCheckIns: this.ownerCheckIns$(session.id),
          reviews: this.ownerReviews$(session.id),
        }).pipe(
          map(({ checkInDashboard, commitments, persistedCheckIns, reviews }) =>
            this.toDashboard(
              checkInDashboard.dueCheckIns,
              commitments,
              persistedCheckIns,
              reviews,
            ),
          ),
        );
      }),
    );
  }

  private toDashboard(
    dueCheckIns: DueCheckIn[],
    commitments: Commitment[],
    checkIns: CheckIn[],
    reviews: CheckInReview[],
  ): UserDashboard {
    const activeCommitments = commitments.filter(
      (commitment) => commitment.status === CommitmentStatus.Active,
    );

    return {
      checkInsDueToday: dueCheckIns.filter((checkIn) =>
        this.isDueToday(checkIn),
      ),
      retroactiveCheckIns: dueCheckIns.filter((checkIn) =>
        this.isRetroactiveCheckIn(checkIn),
      ),
      recentReviewResults: this.recentReviewResults(
        activeCommitments,
        checkIns,
        reviews,
      ),
      activeCommitments: this.commitmentProgress(activeCommitments, checkIns),
    };
  }

  private ownerCommitments$(ownerUserId: string): Observable<Commitment[]> {
    const commitmentsQuery = query(
      collection(this.firestore, FirebaseCollection.Commitments),
      where('ownerUserId', '==', ownerUserId),
    );

    return collectionData(commitmentsQuery).pipe(
      map((commitments) =>
        commitments
          .map((commitment) =>
            this.toCommitment(commitment as Record<string, unknown>),
          )
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
      ),
    );
  }

  private ownerCheckIns$(ownerUserId: string): Observable<CheckIn[]> {
    const checkInsQuery = query(
      collection(this.firestore, FirebaseCollection.CheckIns),
      where('ownerUserId', '==', ownerUserId),
    );

    return collectionData(checkInsQuery).pipe(
      map((checkIns) =>
        checkIns
          .map((checkIn) => this.toCheckIn(checkIn as Record<string, unknown>))
          .sort(
            (a, b) =>
              this.checkInSortDate(b).getTime() -
              this.checkInSortDate(a).getTime(),
          ),
      ),
    );
  }

  private ownerReviews$(ownerUserId: string): Observable<CheckInReview[]> {
    const reviewsQuery = query(
      collection(this.firestore, FirebaseCollection.Reviews),
      where('ownerUserId', '==', ownerUserId),
    );

    return collectionData(reviewsQuery).pipe(
      map((reviews) =>
        reviews
          .map((review) =>
            this.toCheckInReview(review as Record<string, unknown>),
          )
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      ),
    );
  }

  private recentReviewResults(
    commitments: Commitment[],
    checkIns: CheckIn[],
    reviews: CheckInReview[],
  ): UserDashboardReviewResult[] {
    const commitmentMap = new Map(
      commitments.map((commitment) => [commitment.id, commitment]),
    );
    const checkInMap = new Map(checkIns.map((checkIn) => [checkIn.id, checkIn]));

    return reviews
      .map((review) => {
        const checkIn = checkInMap.get(review.checkInId);
        const commitment = commitmentMap.get(review.commitmentId);

        if (!checkIn || !commitment) {
          return null;
        }

        return { checkIn, commitment, review };
      })
      .filter((item): item is UserDashboardReviewResult => item !== null)
      .slice(0, RECENT_REVIEW_LIMIT);
  }

  private commitmentProgress(
    commitments: Commitment[],
    checkIns: CheckIn[],
  ): UserDashboardCommitmentProgress[] {
    return commitments.map((commitment) => ({
      commitment,
      metrics: this.metrics.metricsForCheckIns(
        checkIns.filter((checkIn) => checkIn.commitmentId === commitment.id),
      ),
    }));
  }

  private isDueToday(checkIn: DueCheckIn): boolean {
    return (
      checkIn.persistedCheckIn === null && this.isToday(checkIn.period.deadline)
    );
  }

  private isRetroactiveCheckIn(checkIn: DueCheckIn): boolean {
    return (
      checkIn.canSubmit &&
      checkIn.persistedCheckIn?.status === CheckInStatus.Missed
    );
  }

  private isToday(date: Date): boolean {
    const now = new Date();

    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

  private emptyDashboard(): UserDashboard {
    return {
      checkInsDueToday: [],
      retroactiveCheckIns: [],
      recentReviewResults: [],
      activeCommitments: [],
    };
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

  private toCheckInReview(value: Record<string, unknown>): CheckInReview {
    return {
      id: this.toStringField(value, 'id'),
      checkInId: this.toStringField(value, 'checkInId'),
      commitmentId: this.toStringField(value, 'commitmentId'),
      ownerUserId: this.toStringField(value, 'ownerUserId'),
      managerUserIds: this.toStringArray(value['managerUserIds']),
      reviewerUserId: this.toStringField(value, 'reviewerUserId'),
      decision: this.toCheckInReviewDecision(value['decision']),
      comment: this.toNullableString(value['comment']),
      createdAt: this.toDate(value['createdAt']),
    };
  }

  private checkInSortDate(checkIn: CheckIn): Date {
    return checkIn.submittedAt ?? checkIn.missedAt ?? checkIn.dueAt;
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

  private toCheckInReviewDecision(value: unknown): CheckInReviewDecision {
    if (
      value === CheckInReviewDecision.Passed ||
      value === CheckInReviewDecision.Failed ||
      value === CheckInReviewDecision.NeedsMoreEvidence
    ) {
      return value;
    }

    throw new Error('Invalid check-in review decision');
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
