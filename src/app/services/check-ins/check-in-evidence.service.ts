import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  Timestamp,
  collection,
  collectionData,
  query,
  where,
} from '@angular/fire/firestore';
import { Storage, getDownloadURL, ref } from '@angular/fire/storage';
import { from, map, Observable, of, switchMap } from 'rxjs';

import { CheckInEvidenceFileCategory } from '../../constants/check-in-evidence-file-types';
import { FirebaseCollection } from '../../constants/firebase-collections';
import { CheckInEvidence } from '../../models/check-in-evidence.model';
import { Commitment } from '../../models/commitment.model';

@Injectable({
  providedIn: 'root',
})
export class CheckInEvidenceService {
  private readonly firestore = inject(Firestore);
  private readonly storage = inject(Storage);

  evidenceForOwner$(ownerUserId: string): Observable<CheckInEvidence[]> {
    return this.evidenceQuery$([where('ownerUserId', '==', ownerUserId)]);
  }

  evidenceForManager$(managerUserId: string): Observable<CheckInEvidence[]> {
    return this.evidenceQuery$([
      where('managerUserIds', 'array-contains', managerUserId),
    ]);
  }

  evidenceForCommitmentForViewer$(
    commitment: Commitment,
    userId: string,
  ): Observable<CheckInEvidence[]> {
    const accessFilter =
      commitment.ownerUserId === userId
        ? where('ownerUserId', '==', userId)
        : where('managerUserIds', 'array-contains', userId);

    return this.evidenceQuery$([
      where('commitmentId', '==', commitment.id),
      accessFilter,
    ]);
  }

  private evidenceQuery$(
    filters: ReturnType<typeof where>[],
  ): Observable<CheckInEvidence[]> {
    const evidenceQuery = query(
      collection(this.firestore, FirebaseCollection.CheckInEvidence),
      ...filters,
    );

    return collectionData(evidenceQuery).pipe(
      map((evidence) =>
        evidence
          .map((item) => this.toEvidenceMetadata(item as Record<string, unknown>))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      ),
      switchMap((evidence) => {
        if (evidence.length === 0) {
          return of([]);
        }

        return from(Promise.all(evidence.map((item) => this.withDownloadUrl(item))));
      }),
    );
  }

  private async withDownloadUrl(
    item: Omit<CheckInEvidence, 'downloadUrl'>,
  ): Promise<CheckInEvidence> {
    try {
      return {
        ...item,
        downloadUrl: await getDownloadURL(ref(this.storage, item.storagePath)),
      };
    } catch {
      return {
        ...item,
        downloadUrl: null,
      };
    }
  }

  private toEvidenceMetadata(
    value: Record<string, unknown>,
  ): Omit<CheckInEvidence, 'downloadUrl'> {
    return {
      id: this.toStringField(value, 'id'),
      checkInId: this.toStringField(value, 'checkInId'),
      commitmentId: this.toStringField(value, 'commitmentId'),
      ownerUserId: this.toStringField(value, 'ownerUserId'),
      managerUserIds: this.toStringArray(value['managerUserIds']),
      periodIndex: this.toNumberField(value, 'periodIndex'),
      fileName: this.toStringField(value, 'fileName'),
      contentType: this.toStringField(value, 'contentType'),
      size: this.toNumberField(value, 'size'),
      storagePath: this.toStringField(value, 'storagePath'),
      category: this.toFileCategory(value['category']),
      createdAt: this.toDate(value['createdAt']),
    };
  }

  private toFileCategory(value: unknown): CheckInEvidenceFileCategory {
    if (
      value === CheckInEvidenceFileCategory.Image ||
      value === CheckInEvidenceFileCategory.Pdf
    ) {
      return value;
    }

    throw new Error('Invalid evidence file category');
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

  private toDate(value: unknown): Date {
    if (value instanceof Timestamp) {
      return value.toDate();
    }

    throw new Error('Invalid timestamp field');
  }
}
