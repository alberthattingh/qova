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
import { CheckInStatus } from '../../constants/check-in-statuses';
import { CommitmentStatus } from '../../constants/commitment-statuses';
import { FirebaseCollection } from '../../constants/firebase-collections';
import { ManagerInvitationStatus } from '../../constants/manager-invitation-statuses';
import { ManagerRelationshipStatus } from '../../constants/manager-relationship-statuses';
import { CheckIn } from '../../models/check-in.model';
import { CommitmentManager } from '../../models/commitment-manager.model';
import { Commitment } from '../../models/commitment.model';
import { ManagerDashboardCheckInItem } from '../../models/manager-dashboard-check-in-item.model';
import { ManagerDashboard } from '../../models/manager-dashboard.model';
import { ManagerInvitation } from '../../models/manager-invitation.model';
import { ManagerRelationship } from '../../models/manager-relationship.model';
import { ReviewQueueItem } from '../../models/review-queue-item.model';
import { UserProfile } from '../../models/user-profile.model';
import { AuthService } from '../auth/auth.service';
import { ReviewQueueService } from '../reviews/review-queue.service';
import { UserService } from '../user/user.service';

const RECENT_ITEM_LIMIT = 5;

@Injectable({
  providedIn: 'root',
})
export class ManagerDashboardService {
  private readonly auth = inject(AuthService);
  private readonly firestore = inject(Firestore);
  private readonly reviewQueue = inject(ReviewQueueService);
  private readonly users = inject(UserService);

  dashboard$(): Observable<ManagerDashboard> {
    return this.auth.currentAuthSession$.pipe(
      switchMap((session) => {
        if (!session) {
          return of(this.emptyDashboard());
        }

        return combineLatest({
          reviewQueue: this.reviewQueue.queue$(),
          checkIns: this.managerCheckIns$(session.id),
          commitments: this.managerCommitments$(session.id),
          pendingInvitations: this.pendingInvitations$(session.id),
          relationships: this.relationships$(session.id),
          users: this.users.profiles$(),
        }).pipe(
          map(
            ({
              reviewQueue,
              checkIns,
              commitments,
              pendingInvitations,
              relationships,
              users,
            }) =>
              this.toDashboard(
                reviewQueue.items,
                checkIns,
                commitments,
                pendingInvitations,
                relationships,
                users,
              ),
          ),
        );
      }),
    );
  }

  private toDashboard(
    queueItems: ReviewQueueItem[],
    checkIns: CheckIn[],
    commitments: Commitment[],
    pendingInvitations: ManagerInvitation[],
    relationships: ManagerRelationship[],
    users: UserProfile[],
  ): ManagerDashboard {
    const hydratedItems = this.itemsFromRecords(checkIns, commitments, users);

    return {
      awaitingReview: queueItems.filter(
        (item) => item.checkIn.status === CheckInStatus.Submitted,
      ),
      missedCheckIns: hydratedItems.filter(
        (item) => item.checkIn.status === CheckInStatus.Missed,
      ),
      requestsRequiringAttention: hydratedItems.filter(
        (item) => item.checkIn.status === CheckInStatus.NeedsMoreEvidence,
      ),
      pendingInvitations,
      managedUsers: relationships,
      recentFailures: this.recentItems(
        hydratedItems.filter(
          (item) => item.checkIn.status === CheckInStatus.Failed,
        ),
      ),
      recentLateSubmissions: this.recentItems(
        hydratedItems.filter((item) => item.checkIn.isLate),
      ),
    };
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
          .sort(
            (a, b) =>
              this.checkInSortDate(b).getTime() -
              this.checkInSortDate(a).getTime(),
          ),
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

  private pendingInvitations$(
    managerUserId: string,
  ): Observable<ManagerInvitation[]> {
    const invitationsQuery = query(
      collection(this.firestore, FirebaseCollection.ManagerInvitations),
      where('managerUserId', '==', managerUserId),
      where('status', '==', ManagerInvitationStatus.Pending),
    );

    return collectionData(invitationsQuery).pipe(
      map((invitations) =>
        invitations
          .map((invitation) =>
            this.toManagerInvitation(invitation as Record<string, unknown>),
          )
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      ),
    );
  }

  private relationships$(managerUserId: string): Observable<ManagerRelationship[]> {
    const relationshipsQuery = query(
      collection(this.firestore, FirebaseCollection.ManagerRelationships),
      where('managerUserId', '==', managerUserId),
      where('status', '==', ManagerRelationshipStatus.Active),
    );

    return collectionData(relationshipsQuery).pipe(
      map((relationships) =>
        relationships
          .map((relationship) =>
            this.toManagerRelationship(relationship as Record<string, unknown>),
          )
          .sort((a, b) =>
            a.managedUserDisplayName.localeCompare(b.managedUserDisplayName),
          ),
      ),
    );
  }

  private itemsFromRecords(
    checkIns: CheckIn[],
    commitments: Commitment[],
    users: UserProfile[],
  ): ManagerDashboardCheckInItem[] {
    const commitmentMap = new Map(
      commitments.map((commitment) => [commitment.id, commitment]),
    );
    const userMap = new Map(users.map((user) => [user.id, user]));

    return checkIns
      .map((checkIn) => {
        const commitment = commitmentMap.get(checkIn.commitmentId);
        const user = userMap.get(checkIn.ownerUserId);

        if (!commitment || !user) {
          return null;
        }

        return { checkIn, commitment, user };
      })
      .filter((item): item is ManagerDashboardCheckInItem => item !== null);
  }

  private recentItems(
    items: ManagerDashboardCheckInItem[],
  ): ManagerDashboardCheckInItem[] {
    return [...items]
      .sort(
        (a, b) =>
          this.checkInSortDate(b.checkIn).getTime() -
          this.checkInSortDate(a.checkIn).getTime(),
      )
      .slice(0, RECENT_ITEM_LIMIT);
  }

  private emptyDashboard(): ManagerDashboard {
    return {
      awaitingReview: [],
      missedCheckIns: [],
      requestsRequiringAttention: [],
      pendingInvitations: [],
      managedUsers: [],
      recentFailures: [],
      recentLateSubmissions: [],
    };
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

  private toManagerInvitation(value: Record<string, unknown>): ManagerInvitation {
    return {
      id: this.toStringField(value, 'id'),
      managedUserId: this.toStringField(value, 'managedUserId'),
      managedUserDisplayName: this.toStringField(value, 'managedUserDisplayName'),
      managedUserEmail: this.toStringField(value, 'managedUserEmail'),
      managedUserProfileImageUrl: this.toStringField(
        value,
        'managedUserProfileImageUrl',
      ),
      managerUserId: this.toStringField(value, 'managerUserId'),
      managerDisplayName: this.toStringField(value, 'managerDisplayName'),
      managerEmail: this.toStringField(value, 'managerEmail'),
      managerProfileImageUrl: this.toStringField(value, 'managerProfileImageUrl'),
      status: this.toManagerInvitationStatus(value['status']),
      createdAt: this.toDate(value['createdAt']),
      updatedAt: this.toDate(value['updatedAt']),
    };
  }

  private toManagerRelationship(
    value: Record<string, unknown>,
  ): ManagerRelationship {
    return {
      id: this.toStringField(value, 'id'),
      managedUserId: this.toStringField(value, 'managedUserId'),
      managedUserDisplayName: this.toStringField(value, 'managedUserDisplayName'),
      managedUserEmail: this.toStringField(value, 'managedUserEmail'),
      managedUserProfileImageUrl: this.toStringField(
        value,
        'managedUserProfileImageUrl',
      ),
      managerUserId: this.toStringField(value, 'managerUserId'),
      managerDisplayName: this.toStringField(value, 'managerDisplayName'),
      managerEmail: this.toStringField(value, 'managerEmail'),
      managerProfileImageUrl: this.toStringField(value, 'managerProfileImageUrl'),
      status: this.toManagerRelationshipStatus(value['status']),
      createdAt: this.toDate(value['createdAt']),
      updatedAt: this.toDate(value['updatedAt']),
      endedAt: this.toNullableDate(value['endedAt']),
      endedByUserId: this.toNullableString(value['endedByUserId']),
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

    if (
      value !== CheckInClaimedResult.Passed &&
      value !== CheckInClaimedResult.Failed
    ) {
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

  private toManagerInvitationStatus(value: unknown): ManagerInvitationStatus {
    if (
      value === ManagerInvitationStatus.Pending ||
      value === ManagerInvitationStatus.Accepted ||
      value === ManagerInvitationStatus.Declined ||
      value === ManagerInvitationStatus.Cancelled
    ) {
      return value;
    }

    throw new Error('Invalid manager invitation status');
  }

  private toManagerRelationshipStatus(value: unknown): ManagerRelationshipStatus {
    if (
      value === ManagerRelationshipStatus.Active ||
      value === ManagerRelationshipStatus.Removed
    ) {
      return value;
    }

    throw new Error('Invalid manager relationship status');
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
