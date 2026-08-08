import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  Timestamp,
  collection,
  collectionData,
  doc,
  DocumentReference,
  getDoc,
  query,
  runTransaction,
  where,
} from '@angular/fire/firestore';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';

import { CheckInFrequency } from '../../constants/check-in-frequency';
import { CheckInStatus } from '../../constants/check-in-statuses';
import { CommitmentStatus } from '../../constants/commitment-statuses';
import { DueCheckInStatus } from '../../constants/due-check-in-statuses';
import { FirebaseCollection } from '../../constants/firebase-collections';
import { CheckInDashboard } from '../../models/check-in-dashboard.model';
import { CheckInEvidence } from '../../models/check-in-evidence.model';
import { CheckInPeriod } from '../../models/check-in-period.model';
import { CheckInScheduleInput } from '../../models/check-in-schedule-input.model';
import { CheckIn } from '../../models/check-in.model';
import { CommitmentManager } from '../../models/commitment-manager.model';
import { Commitment } from '../../models/commitment.model';
import { DueCheckIn } from '../../models/due-check-in.model';
import { SubmitCheckInRequest } from '../../models/submit-check-in-request.model';
import { UploadedCheckInEvidence } from '../../models/uploaded-check-in-evidence.model';
import { AuthService } from '../auth/auth.service';
import { CheckInEvidenceService } from './check-in-evidence.service';
import { CheckInEvidenceStorageService } from './check-in-evidence-storage.service';
import { CheckInScheduleService } from './check-in-schedule.service';

@Injectable({
  providedIn: 'root',
})
export class CheckInService {
  private readonly auth = inject(AuthService);
  private readonly evidence = inject(CheckInEvidenceService);
  private readonly evidenceStorage = inject(CheckInEvidenceStorageService);
  private readonly firestore = inject(Firestore);
  private readonly schedules = inject(CheckInScheduleService);

  dashboard$(): Observable<CheckInDashboard> {
    return this.auth.currentAuthSession$.pipe(
      switchMap((session) => {
        if (!session) {
          return of({ dueCheckIns: [], managedCheckIns: [] });
        }

        return combineLatest({
          ownedCommitments: this.activeOwnedCommitments$(session.id),
          managedCommitments: this.activeManagedCommitments$(session.id),
          ownedCheckIns: this.ownerCheckIns$(session.id),
          managedCheckIns: this.managerCheckIns$(session.id),
          ownedEvidence: this.evidence.evidenceForOwner$(session.id),
          managedEvidence: this.evidence.evidenceForManager$(session.id),
        }).pipe(
          map(({
            ownedCommitments,
            managedCommitments,
            ownedCheckIns,
            managedCheckIns,
            ownedEvidence,
            managedEvidence,
          }) => ({
            dueCheckIns: ownedCommitments
              .map((commitment) =>
                this.ownerDueCheckIn(
                  commitment,
                  this.withEvidence(ownedCheckIns, ownedEvidence),
                ),
              )
              .filter((checkIn): checkIn is DueCheckIn => checkIn !== null),
            managedCheckIns: managedCommitments
              .map((commitment) =>
                this.managerVisibleCheckIn(
                  commitment,
                  this.withEvidence(managedCheckIns, managedEvidence),
                ),
              )
              .filter((checkIn): checkIn is DueCheckIn => checkIn !== null),
          })),
        );
      }),
    );
  }

  async submitCurrentCheckIn(request: SubmitCheckInRequest): Promise<void> {
    const currentUserId = await this.auth.currentUserId();
    const commitment = await this.commitmentSnapshot(request.commitmentId);

    if (commitment.ownerUserId !== currentUserId) {
      throw new Error('Only the commitment owner can submit this check-in');
    }

    if (commitment.status !== CommitmentStatus.Active) {
      throw new Error('Only active commitments can receive check-ins');
    }

    const period = this.schedules.currentPeriod(this.scheduleInput(commitment));

    if (!period) {
      throw new Error('There is no current check-in period for this commitment');
    }

    if (this.schedules.isPeriodOverdue(period)) {
      throw new Error('The current check-in deadline has passed');
    }

    const checkInId = this.checkInId(commitment.id, period);
    const checkInReference = this.checkInRef(checkInId);
    const claimedResult = request.claimedResult.trim();
    const comment = request.comment?.trim() || null;
    const evidenceFiles = request.evidenceFiles;

    if (!claimedResult) {
      throw new Error('Enter a claimed result before submitting');
    }

    const evidenceUploads = await Promise.all(
      evidenceFiles.map(async (file) => {
        const evidenceReference = this.checkInEvidenceRef();
        const upload = await this.evidenceStorage.uploadEvidenceFile(
          currentUserId,
          checkInId,
          evidenceReference.id,
          file,
        );

        return { evidenceReference, upload };
      }),
    );

    await runTransaction(this.firestore, async (transaction) => {
      const existingCheckIn = await transaction.get(checkInReference);

      if (existingCheckIn.exists()) {
        throw new Error('This check-in period has already been submitted');
      }

      transaction.set(checkInReference, {
        id: checkInId,
        commitmentId: commitment.id,
        ownerUserId: commitment.ownerUserId,
        managerUserIds: commitment.managerUserIds,
        userId: currentUserId,
        periodIndex: period.index,
        periodStartsAt: Timestamp.fromDate(period.startsAt),
        periodEndsAt: Timestamp.fromDate(period.endsAt),
        deadline: Timestamp.fromDate(period.deadline),
        claimedResult,
        comment,
        status: CheckInStatus.Submitted,
        submittedAt: Timestamp.now(),
      });

      const createdAt = Timestamp.now();

      evidenceUploads.forEach(({ evidenceReference, upload }) => {
        transaction.set(
          evidenceReference,
          this.evidenceMetadata(
            evidenceReference.id,
            checkInId,
            commitment,
            period,
            upload,
            createdAt,
          ),
        );
      });
    });
  }

  private activeOwnedCommitments$(ownerUserId: string): Observable<Commitment[]> {
    return this.commitmentsQuery$([where('ownerUserId', '==', ownerUserId)]).pipe(
      map((commitments) =>
        commitments.filter(
          (commitment) => commitment.status === CommitmentStatus.Active,
        ),
      ),
    );
  }

  private activeManagedCommitments$(
    managerUserId: string,
  ): Observable<Commitment[]> {
    return this.commitmentsQuery$([
      where('managerUserIds', 'array-contains', managerUserId),
    ]).pipe(
      map((commitments) =>
        commitments.filter(
          (commitment) => commitment.status === CommitmentStatus.Active,
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

  private ownerCheckIns$(ownerUserId: string): Observable<CheckIn[]> {
    return this.checkInsQuery$([where('ownerUserId', '==', ownerUserId)]);
  }

  private managerCheckIns$(managerUserId: string): Observable<CheckIn[]> {
    return this.checkInsQuery$([
      where('managerUserIds', 'array-contains', managerUserId),
    ]);
  }

  private checkInsQuery$(
    filters: ReturnType<typeof where>[],
  ): Observable<CheckIn[]> {
    const checkInsQuery = query(
      collection(this.firestore, FirebaseCollection.CheckIns),
      ...filters,
    );

    return collectionData(checkInsQuery).pipe(
      map((checkIns) =>
        checkIns
          .map((checkIn) => this.toCheckIn(checkIn as Record<string, unknown>))
          .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()),
      ),
    );
  }

  private ownerDueCheckIn(
    commitment: Commitment,
    checkIns: CheckIn[],
  ): DueCheckIn | null {
    const period = this.schedules.currentPeriod(this.scheduleInput(commitment));

    if (!period) {
      return null;
    }

    const persistedCheckIn = this.checkInForPeriod(commitment.id, period, checkIns);

    if (persistedCheckIn) {
      return null;
    }

    const isOverdue = this.schedules.isPeriodOverdue(period);

    return {
      id: this.checkInId(commitment.id, period),
      commitment,
      period,
      persistedCheckIn: null,
      status: isOverdue
        ? DueCheckInStatus.Missed
        : DueCheckInStatus.AwaitingSubmission,
      canSubmit: !isOverdue,
    };
  }

  private managerVisibleCheckIn(
    commitment: Commitment,
    checkIns: CheckIn[],
  ): DueCheckIn | null {
    const period = this.schedules.currentPeriod(this.scheduleInput(commitment));

    if (!period) {
      return null;
    }

    const persistedCheckIn = this.checkInForPeriod(commitment.id, period, checkIns);

    if (persistedCheckIn) {
      return {
        id: persistedCheckIn.id,
        commitment,
        period,
        persistedCheckIn,
        status: persistedCheckIn.status,
        canSubmit: false,
      };
    }

    if (!this.schedules.isPeriodOverdue(period)) {
      return null;
    }

    return {
      id: this.checkInId(commitment.id, period),
      commitment,
      period,
      persistedCheckIn: null,
      status: DueCheckInStatus.Missed,
      canSubmit: false,
    };
  }

  private checkInForPeriod(
    commitmentId: string,
    period: CheckInPeriod,
    checkIns: CheckIn[],
  ): CheckIn | null {
    return (
      checkIns.find(
        (checkIn) =>
          checkIn.commitmentId === commitmentId &&
          checkIn.periodIndex === period.index,
      ) ?? null
    );
  }

  private withEvidence(
    checkIns: CheckIn[],
    evidence: CheckInEvidence[],
  ): CheckIn[] {
    return checkIns.map((checkIn) => ({
      ...checkIn,
      evidence: evidence.filter((item) => item.checkInId === checkIn.id),
    }));
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

  private checkInRef(checkInId: string) {
    return doc(this.firestore, FirebaseCollection.CheckIns, checkInId);
  }

  private checkInEvidenceRef(): DocumentReference {
    return doc(collection(this.firestore, FirebaseCollection.CheckInEvidence));
  }

  private checkInId(commitmentId: string, period: CheckInPeriod): string {
    return `${commitmentId}_${period.index}`;
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
      status: this.toCheckInStatus(value['status']),
      submittedAt: this.toDate(value['submittedAt']),
    };
  }

  private evidenceMetadata(
    evidenceId: string,
    checkInId: string,
    commitment: Commitment,
    period: CheckInPeriod,
    upload: UploadedCheckInEvidence,
    createdAt: Timestamp,
  ) {
    return {
      id: evidenceId,
      checkInId,
      commitmentId: commitment.id,
      ownerUserId: commitment.ownerUserId,
      managerUserIds: commitment.managerUserIds,
      periodIndex: period.index,
      fileName: upload.fileName,
      contentType: upload.contentType,
      size: upload.size,
      storagePath: upload.storagePath,
      category: upload.category,
      createdAt,
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
      value === CheckInStatus.Passed ||
      value === CheckInStatus.Failed
    ) {
      return value;
    }

    throw new Error('Invalid check-in status');
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
