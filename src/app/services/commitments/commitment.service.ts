import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  Timestamp,
  collection,
  collectionData,
  doc,
  docData,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';

import { CheckInClaimedResult } from '../../constants/check-in-claimed-results';
import { CheckInFrequency } from '../../constants/check-in-frequency';
import { CheckInReviewDecision } from '../../constants/check-in-review-decisions';
import { CheckInStatus } from '../../constants/check-in-statuses';
import { CommitmentStatus } from '../../constants/commitment-statuses';
import { FirebaseCollection } from '../../constants/firebase-collections';
import { ManagerRelationshipStatus } from '../../constants/manager-relationship-statuses';
import { CheckIn } from '../../models/check-in.model';
import { CheckInReview } from '../../models/check-in-review.model';
import { CheckInScheduleInput } from '../../models/check-in-schedule-input.model';
import { CommitmentDetailView } from '../../models/commitment-detail-view.model';
import { CommitmentManager } from '../../models/commitment-manager.model';
import { CommitmentTerms } from '../../models/commitment-terms.model';
import { CommitmentVersion } from '../../models/commitment-version.model';
import { CommitmentWorkspace } from '../../models/commitment-workspace.model';
import { Commitment } from '../../models/commitment.model';
import { CreateCommitmentRequest } from '../../models/create-commitment-request.model';
import { ManagerRelationship } from '../../models/manager-relationship.model';
import { ManagedCommitment } from '../../models/managed-commitment.model';
import { UpdateCommitmentRequest } from '../../models/update-commitment-request.model';
import { UserProfile } from '../../models/user-profile.model';
import { AuthService } from '../auth/auth.service';
import { CheckInEvidenceService } from '../check-ins/check-in-evidence.service';
import { BrowserTimeZoneService } from '../check-ins/browser-time-zone.service';
import { CheckInScheduleService } from '../check-ins/check-in-schedule.service';
import { UserService } from '../user/user.service';
import { CommitmentMetricsService } from './commitment-metrics.service';

@Injectable({
  providedIn: 'root',
})
export class CommitmentService {
  private readonly auth = inject(AuthService);
  private readonly evidence = inject(CheckInEvidenceService);
  private readonly checkInSchedules = inject(CheckInScheduleService);
  private readonly browserTimeZone = inject(BrowserTimeZoneService);
  private readonly firestore = inject(Firestore);
  private readonly metrics = inject(CommitmentMetricsService);
  private readonly users = inject(UserService);

  workspace$(): Observable<CommitmentWorkspace> {
    return this.auth.currentAuthSession$.pipe(
      switchMap((session) => {
        if (!session) {
          return of(this.emptyWorkspace());
        }

        return combineLatest({
          ownedCommitments: this.ownedCommitments$(session.id),
          managerCommitments: this.assignedManagerCommitments$(session.id),
          availableManagers: this.activeManagerRelationships$(session.id),
          userProfiles: this.users.profiles$(),
        }).pipe(
          map(({
            ownedCommitments,
            managerCommitments,
            availableManagers,
            userProfiles,
          }) => ({
            activeCommitments: this.commitmentsWithStatus(
              ownedCommitments,
              CommitmentStatus.Active,
            ),
            draftCommitments: this.commitmentsWithStatus(
              ownedCommitments,
              CommitmentStatus.Draft,
            ),
            completedCommitments: ownedCommitments.filter((commitment) =>
              this.isTerminalWorkspaceStatus(commitment.status),
            ),
            managerCommitments: this.withCommitmentOwners(
              managerCommitments,
              userProfiles,
            ),
            availableManagers,
          })),
        );
      }),
    );
  }

  commitmentDetails$(
    commitmentId: string,
  ): Observable<CommitmentDetailView | null> {
    return this.auth.currentAuthSession$.pipe(
      switchMap((session) => {
        if (!session) {
          return of(null);
        }

        return docData(this.commitmentRef(commitmentId)).pipe(
          switchMap((value) => {
            if (!value) {
              return of(null);
            }

            const commitment = this.toCommitment(value as Record<string, unknown>);

            if (!this.isCommitmentParticipant(commitment, session.id)) {
              return of(null);
            }

            if (commitment.status === CommitmentStatus.Draft) {
              return of({
                commitment,
                versions: [],
                checkIns: [],
                metrics: this.metrics.metricsForCheckIns([]),
                scheduleState: this.checkInSchedules.scheduleState(
                  this.scheduleInput(commitment),
                ),
                currentCheckInState: null,
              });
            }

            return combineLatest({
              versions: this.commitmentVersionsForViewer$(
                commitment,
                session.id,
              ),
              checkIns: this.checkInsForCommitmentForViewer$(
                commitment,
                session.id,
              ),
              evidence: this.evidence.evidenceForCommitmentForViewer$(
                commitment,
                session.id,
              ),
              reviews: this.reviewsForCommitmentForViewer$(
                commitment,
                session.id,
              ),
            }).pipe(
              map(({ versions, checkIns, evidence, reviews }) => {
                const hydratedCheckIns = this.withReviews(
                  this.withEvidence(checkIns, evidence),
                  reviews,
                );

                return {
                  commitment,
                  versions,
                  checkIns: hydratedCheckIns,
                  metrics: this.metrics.metricsForCheckIns(hydratedCheckIns),
                  scheduleState: this.checkInSchedules.scheduleState(
                    this.scheduleInput(commitment),
                  ),
                  currentCheckInState:
                    this.checkInSchedules.currentPeriodSubmissionState(
                      this.scheduleInput(commitment),
                      hydratedCheckIns,
                    ),
                };
              }),
            );
          }),
        );
      }),
    );
  }

  async createDraft(request: CreateCommitmentRequest): Promise<string> {
    const ownerUserId = await this.auth.currentUserId();
    const terms = await this.validatedTerms(ownerUserId, request);
    const commitmentReference = doc(
      collection(this.firestore, FirebaseCollection.Commitments),
    );
    const timestamp = Timestamp.now();

    await setDoc(commitmentReference, {
      id: commitmentReference.id,
      ownerUserId,
      ...this.persistedTerms(terms),
      status: CommitmentStatus.Draft,
      nextCheckInAt: null,
      currentVersionId: null,
      currentVersionNumber: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return commitmentReference.id;
  }

  async updateDraft(request: UpdateCommitmentRequest): Promise<void> {
    const ownerUserId = await this.auth.currentUserId();
    const commitment = await this.commitmentSnapshot(request.commitmentId);

    this.assertOwner(commitment, ownerUserId);

    if (commitment.status !== CommitmentStatus.Draft) {
      throw new Error('Only draft commitments can be edited directly');
    }

    const terms = await this.validatedTerms(ownerUserId, request);

    await updateDoc(this.commitmentRef(commitment.id), {
      ...this.persistedTerms(terms),
      updatedAt: Timestamp.now(),
    });
  }

  async activate(commitmentId: string): Promise<void> {
    const ownerUserId = await this.auth.currentUserId();
    const commitment = await this.commitmentSnapshot(commitmentId);

    this.assertOwner(commitment, ownerUserId);

    if (commitment.status !== CommitmentStatus.Draft) {
      throw new Error('Only draft commitments can be activated');
    }

    await this.createVersionAndUpdateCommitment(
      commitment,
      this.termsFromCommitment(commitment),
      CommitmentStatus.Active,
      ownerUserId,
    );
  }

  async reviseActiveTerms(request: UpdateCommitmentRequest): Promise<void> {
    const ownerUserId = await this.auth.currentUserId();
    const commitment = await this.commitmentSnapshot(request.commitmentId);

    this.assertOwner(commitment, ownerUserId);

    if (commitment.status !== CommitmentStatus.Active) {
      throw new Error('Only active commitments can receive versioned term updates');
    }

    const terms = await this.validatedTerms(ownerUserId, request);

    await this.createVersionAndUpdateCommitment(
      commitment,
      terms,
      CommitmentStatus.Active,
      ownerUserId,
    );
  }

  async complete(commitmentId: string): Promise<void> {
    await this.updateOwnedStatus(commitmentId, CommitmentStatus.Completed);
  }

  async cancel(commitmentId: string): Promise<void> {
    await this.updateOwnedStatus(commitmentId, CommitmentStatus.Cancelled);
  }

  private ownedCommitments$(ownerUserId: string): Observable<Commitment[]> {
    return this.commitmentsQuery$([
      where('ownerUserId', '==', ownerUserId),
    ]);
  }

  private assignedManagerCommitments$(
    managerUserId: string,
  ): Observable<Commitment[]> {
    return this.commitmentsQuery$([
      where('managerUserIds', 'array-contains', managerUserId),
    ]).pipe(
      map((commitments) =>
        commitments.filter((commitment) =>
          this.isManagerWorkspaceStatus(commitment.status),
        ),
      ),
    );
  }

  private commitmentsQuery$(
    filters: ReturnType<typeof where>[],
  ): Observable<Commitment[]> {
    const commitmentsQuery = query(
      collection(this.firestore, FirebaseCollection.Commitments),
      ...filters,
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

  private activeManagerRelationships$(
    managedUserId: string,
  ): Observable<ManagerRelationship[]> {
    const relationshipsQuery = query(
      collection(this.firestore, FirebaseCollection.ManagerRelationships),
      where('managedUserId', '==', managedUserId),
      where('status', '==', ManagerRelationshipStatus.Active),
    );

    return collectionData(relationshipsQuery).pipe(
      map((relationships) =>
        relationships
          .map((relationship) =>
            this.toManagerRelationship(relationship as Record<string, unknown>),
          )
          .sort((a, b) =>
            a.managerDisplayName.localeCompare(b.managerDisplayName),
          ),
      ),
    );
  }

  private commitmentVersionsForViewer$(
    commitment: Commitment,
    userId: string,
  ): Observable<CommitmentVersion[]> {
    const accessFilter =
      commitment.ownerUserId === userId
        ? where('ownerUserId', '==', userId)
        : where('managerUserIds', 'array-contains', userId);
    const versionsQuery = query(
      collection(this.firestore, FirebaseCollection.CommitmentVersions),
      where('commitmentId', '==', commitment.id),
      accessFilter,
    );

    return collectionData(versionsQuery).pipe(
      map((versions) =>
        versions
          .map((version) =>
            this.toCommitmentVersion(version as Record<string, unknown>),
          )
          .sort((a, b) => b.versionNumber - a.versionNumber),
      ),
    );
  }

  private checkInsForCommitmentForViewer$(
    commitment: Commitment,
    userId: string,
  ): Observable<CheckIn[]> {
    const accessFilter =
      commitment.ownerUserId === userId
        ? where('ownerUserId', '==', userId)
        : where('managerUserIds', 'array-contains', userId);
    const checkInsQuery = query(
      collection(this.firestore, FirebaseCollection.CheckIns),
      where('commitmentId', '==', commitment.id),
      accessFilter,
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

  private reviewsForCommitmentForViewer$(
    commitment: Commitment,
    userId: string,
  ): Observable<CheckInReview[]> {
    const accessFilter =
      commitment.ownerUserId === userId
        ? where('ownerUserId', '==', userId)
        : where('managerUserIds', 'array-contains', userId);
    const reviewsQuery = query(
      collection(this.firestore, FirebaseCollection.Reviews),
      where('commitmentId', '==', commitment.id),
      accessFilter,
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

  private async validatedTerms(
    ownerUserId: string,
    request: CreateCommitmentRequest,
  ): Promise<CommitmentTerms> {
    const managerUserIds = [...new Set(request.managerUserIds)];

    if (managerUserIds.length === 0) {
      throw new Error('Select at least one active manager');
    }

    if (request.endDate && request.endDate < request.startDate) {
      throw new Error('End date cannot be before start date');
    }

    const activeManagers = await this.activeManagerRelationshipSnapshots(ownerUserId);
    const activeManagerMap = new Map(
      activeManagers.docs.map((snapshot) => {
        const relationship = this.toManagerRelationship(
          snapshot.data() as Record<string, unknown>,
        );

        return [relationship.managerUserId, relationship];
      }),
    );
    const invalidManagerId = managerUserIds.find(
      (managerUserId) => !activeManagerMap.has(managerUserId),
    );

    if (invalidManagerId) {
      throw new Error('Commitments can only use active managers');
    }

    return {
      managerUserIds,
      managers: managerUserIds.map((managerUserId) =>
        this.managerFromRelationship(activeManagerMap.get(managerUserId)),
      ),
      title: request.title.trim(),
      description: request.description.trim(),
      targetDescription: request.targetDescription.trim(),
      evidenceInstructions: request.evidenceInstructions.trim(),
      startDate: request.startDate,
      endDate: request.endDate,
      checkInFrequency: request.checkInFrequency,
      checkInTime: request.checkInTime,
      timeZone: this.browserTimeZone.currentTimeZone(),
    };
  }

  private activeManagerRelationshipSnapshots(managedUserId: string) {
    return getDocs(
      query(
        collection(this.firestore, FirebaseCollection.ManagerRelationships),
        where('managedUserId', '==', managedUserId),
        where('status', '==', ManagerRelationshipStatus.Active),
      ),
    );
  }

  private async createVersionAndUpdateCommitment(
    commitment: Commitment,
    terms: CommitmentTerms,
    status: CommitmentStatus,
    createdByUserId: string,
  ): Promise<void> {
    const versionNumber = commitment.currentVersionNumber + 1;
    const versionReference = doc(
      collection(this.firestore, FirebaseCollection.CommitmentVersions),
    );
    const timestamp = Timestamp.now();
    const batch = writeBatch(this.firestore);

    batch.set(versionReference, {
      id: versionReference.id,
      commitmentId: commitment.id,
      ownerUserId: commitment.ownerUserId,
      versionNumber,
      ...this.persistedTerms(terms),
      createdAt: timestamp,
      createdByUserId,
    });
    batch.update(this.commitmentRef(commitment.id), {
      ...this.persistedTerms(terms),
      status,
      nextCheckInAt:
        status === CommitmentStatus.Active
          ? this.nextCheckInAt(terms)
          : null,
      currentVersionId: versionReference.id,
      currentVersionNumber: versionNumber,
      updatedAt: timestamp,
    });

    await batch.commit();
  }

  private async updateOwnedStatus(
    commitmentId: string,
    status: CommitmentStatus,
  ): Promise<void> {
    const ownerUserId = await this.auth.currentUserId();
    const commitment = await this.commitmentSnapshot(commitmentId);

    this.assertOwner(commitment, ownerUserId);

    if (commitment.status === CommitmentStatus.Cancelled) {
      throw new Error('Cancelled commitments cannot be changed');
    }

    await updateDoc(this.commitmentRef(commitment.id), {
      status,
      nextCheckInAt: null,
      updatedAt: Timestamp.now(),
    });
  }

  private async commitmentSnapshot(commitmentId: string): Promise<Commitment> {
    const snapshot = await getDoc(this.commitmentRef(commitmentId));

    if (!snapshot.exists()) {
      throw new Error('Commitment not found');
    }

    return this.toCommitment(snapshot.data() as Record<string, unknown>);
  }

  private commitmentRef(commitmentId: string) {
    return doc(this.firestore, FirebaseCollection.Commitments, commitmentId);
  }

  private persistedTerms(terms: CommitmentTerms) {
    return {
      managerUserIds: terms.managerUserIds,
      managers: terms.managers,
      title: terms.title,
      description: terms.description,
      targetDescription: terms.targetDescription,
      evidenceInstructions: terms.evidenceInstructions,
      startDate: Timestamp.fromDate(terms.startDate),
      endDate: terms.endDate ? Timestamp.fromDate(terms.endDate) : null,
      checkInFrequency: terms.checkInFrequency,
      checkInTime: terms.checkInTime,
      timeZone: terms.timeZone,
    };
  }

  private termsFromCommitment(commitment: Commitment): CommitmentTerms {
    return {
      managerUserIds: commitment.managerUserIds,
      managers: commitment.managers,
      title: commitment.title,
      description: commitment.description,
      targetDescription: commitment.targetDescription,
      evidenceInstructions: commitment.evidenceInstructions,
      startDate: commitment.startDate,
      endDate: commitment.endDate,
      checkInFrequency: commitment.checkInFrequency,
      checkInTime: commitment.checkInTime,
      timeZone: commitment.timeZone,
    };
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

  private nextCheckInAt(terms: CommitmentTerms): Timestamp | null {
    const nextDeadline = this.checkInSchedules.nextCheckInDeadline({
      startDate: terms.startDate,
      endDate: terms.endDate,
      checkInFrequency: terms.checkInFrequency,
      checkInTime: terms.checkInTime,
      timeZone: terms.timeZone,
    });

    return nextDeadline ? Timestamp.fromDate(nextDeadline) : null;
  }

  private commitmentsWithStatus(
    commitments: Commitment[],
    status: CommitmentStatus,
  ): Commitment[] {
    return commitments.filter((commitment) => commitment.status === status);
  }

  private isManagerWorkspaceStatus(status: CommitmentStatus): boolean {
    return status === CommitmentStatus.Draft || status === CommitmentStatus.Active;
  }

  private isTerminalWorkspaceStatus(status: CommitmentStatus): boolean {
    return (
      status === CommitmentStatus.Completed ||
      status === CommitmentStatus.Cancelled
    );
  }

  private assertOwner(commitment: Commitment, userId: string): void {
    if (commitment.ownerUserId !== userId) {
      throw new Error('Only the owner can update this commitment');
    }
  }

  private isCommitmentParticipant(commitment: Commitment, userId: string): boolean {
    return (
      commitment.ownerUserId === userId ||
      commitment.managerUserIds.includes(userId)
    );
  }

  private managerFromRelationship(
    relationship: ManagerRelationship | undefined,
  ): CommitmentManager {
    if (!relationship) {
      throw new Error('Commitment manager relationship not found');
    }

    return {
      id: relationship.managerUserId,
      displayName: relationship.managerDisplayName,
      email: relationship.managerEmail,
      profileImageUrl: relationship.managerProfileImageUrl,
    };
  }

  private withCommitmentOwners(
    commitments: Commitment[],
    profiles: UserProfile[],
  ): ManagedCommitment[] {
    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

    return commitments
      .map((commitment) => {
        const owner = profileMap.get(commitment.ownerUserId);

        if (!owner) {
          return null;
        }

        return {
          commitment,
          owner: {
            id: owner.id,
            displayName: owner.displayName,
            email: owner.email,
            profileImageUrl: owner.profileImageUrl,
          },
        };
      })
      .filter((commitment): commitment is ManagedCommitment => commitment !== null);
  }

  private emptyWorkspace(): CommitmentWorkspace {
    return {
      activeCommitments: [],
      draftCommitments: [],
      completedCommitments: [],
      managerCommitments: [],
      availableManagers: [],
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

  private toCommitmentVersion(value: Record<string, unknown>): CommitmentVersion {
    return {
      id: this.toStringField(value, 'id'),
      commitmentId: this.toStringField(value, 'commitmentId'),
      ownerUserId: this.toStringField(value, 'ownerUserId'),
      versionNumber: this.toNumberField(value, 'versionNumber'),
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
      createdAt: this.toDate(value['createdAt']),
      createdByUserId: this.toStringField(value, 'createdByUserId'),
    };
  }

  private toManagerRelationship(value: Record<string, unknown>): ManagerRelationship {
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
      managerProfileImageUrl: this.toStringField(
        value,
        'managerProfileImageUrl',
      ),
      status: this.toManagerRelationshipStatus(value['status']),
      createdAt: this.toDate(value['createdAt']),
      updatedAt: this.toDate(value['updatedAt']),
      endedAt: this.toNullableDate(value['endedAt']),
      endedByUserId: this.toNullableString(value['endedByUserId']),
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

  private checkInSortDate(checkIn: CheckIn): Date {
    return checkIn.submittedAt ?? checkIn.missedAt ?? checkIn.dueAt;
  }

  private withEvidence(
    checkIns: CheckIn[],
    evidence: CheckIn['evidence'],
  ): CheckIn[] {
    return checkIns.map((checkIn) => ({
      ...checkIn,
      evidence: evidence.filter((item) => item.checkInId === checkIn.id),
    }));
  }

  private withReviews(
    checkIns: CheckIn[],
    reviews: CheckInReview[],
  ): CheckIn[] {
    return checkIns.map((checkIn) => ({
      ...checkIn,
      reviews: reviews.filter((review) => review.checkInId === checkIn.id),
    }));
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

  private toManagerRelationshipStatus(value: unknown): ManagerRelationshipStatus {
    if (
      value === ManagerRelationshipStatus.Active ||
      value === ManagerRelationshipStatus.Removed
    ) {
      return value;
    }

    throw new Error('Invalid manager relationship status');
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
