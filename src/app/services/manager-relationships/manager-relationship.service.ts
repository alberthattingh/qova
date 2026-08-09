import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  Timestamp,
  collection,
  collectionData,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { combineLatest, map, Observable } from 'rxjs';
import { of, switchMap } from 'rxjs';

import { FirebaseCollection } from '../../constants/firebase-collections';
import { ManagerInvitationStatus } from '../../constants/manager-invitation-statuses';
import { ManagerRelationshipStatus } from '../../constants/manager-relationship-statuses';
import { ManagerInvitation } from '../../models/manager-invitation.model';
import { ManagerRelationship } from '../../models/manager-relationship.model';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';

@Injectable({
  providedIn: 'root',
})
export class ManagerRelationshipService {
  private readonly auth = inject(AuthService);
  private readonly firestore = inject(Firestore);
  private readonly users = inject(UserService);

  pendingInvitationsForCurrentUser$(): Observable<ManagerInvitation[]> {
    return this.auth.currentUser$.pipe(
      map((user) => user?.id ?? null),
      map((userId) =>
        userId ? this.pendingInvitationsForManager$(userId) : null,
      ),
      // Avoid components needing to know how to flatten an auth-dependent query.
      switchLatestOrEmpty(),
    );
  }

  sentPendingInvitationsForCurrentUser$(): Observable<ManagerInvitation[]> {
    return this.auth.currentUser$.pipe(
      map((user) => user?.id ?? null),
      map((userId) =>
        userId ? this.pendingInvitationsFromManagedUser$(userId) : null,
      ),
      switchLatestOrEmpty(),
    );
  }

  managersForCurrentUser$(): Observable<ManagerRelationship[]> {
    return this.auth.currentUser$.pipe(
      map((user) => user?.id ?? null),
      map((userId) => (userId ? this.activeManagersForUser$(userId) : null)),
      switchLatestOrEmpty(),
    );
  }

  managedUsersForCurrentUser$(): Observable<ManagerRelationship[]> {
    return this.auth.currentUser$.pipe(
      map((user) => user?.id ?? null),
      map((userId) =>
        userId ? this.activeManagedUsersForManager$(userId) : null,
      ),
      switchLatestOrEmpty(),
    );
  }

  relationshipDashboard$(): Observable<{
    receivedInvitations: ManagerInvitation[];
    sentInvitations: ManagerInvitation[];
    managers: ManagerRelationship[];
    managedUsers: ManagerRelationship[];
  }> {
    return combineLatest({
      receivedInvitations: this.pendingInvitationsForCurrentUser$(),
      sentInvitations: this.sentPendingInvitationsForCurrentUser$(),
      managers: this.managersForCurrentUser$(),
      managedUsers: this.managedUsersForCurrentUser$(),
    });
  }

  async inviteManager(managerEmail: string): Promise<void> {
    const currentUserId = await this.auth.currentUserId();
    const managedUser = await this.users.profileSnapshot(currentUserId);
    const manager = await this.users.profileByEmail(managerEmail);

    if (!manager) {
      throw new Error('Sponsor must be a registered user');
    }

    if (manager.id === managedUser.id) {
      throw new Error('Users cannot invite themselves as a sponsor');
    }

    await this.assertNoDuplicateActiveOrPendingRelationship(
      managedUser.id,
      manager.id,
    );

    const invitationId = this.relationshipPairId(managedUser.id, manager.id);
    const timestamp = Timestamp.now();

    await setDoc(this.invitationRef(invitationId), {
      id: invitationId,
      managedUserId: managedUser.id,
      managedUserDisplayName: managedUser.displayName,
      managedUserEmail: managedUser.email,
      managedUserProfileImageUrl: managedUser.profileImageUrl,
      managerUserId: manager.id,
      managerDisplayName: manager.displayName,
      managerEmail: manager.email,
      managerProfileImageUrl: manager.profileImageUrl,
      status: ManagerInvitationStatus.Pending,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async acceptInvitation(invitationId: string): Promise<void> {
    const currentUserId = await this.auth.currentUserId();
    const invitation = await this.invitationSnapshot(invitationId);

    this.assertPendingInvitationForManager(invitation, currentUserId);
    await this.assertNoActiveRelationship(
      invitation.managedUserId,
      invitation.managerUserId,
    );

    const timestamp = Timestamp.now();
    const relationshipId = this.relationshipPairId(
      invitation.managedUserId,
      invitation.managerUserId,
    );
    const batch = writeBatch(this.firestore);

    batch.update(this.invitationRef(invitation.id), {
      status: ManagerInvitationStatus.Accepted,
      updatedAt: timestamp,
    });
    batch.set(this.relationshipRef(relationshipId), {
      id: relationshipId,
      managedUserId: invitation.managedUserId,
      managedUserDisplayName: invitation.managedUserDisplayName,
      managedUserEmail: invitation.managedUserEmail,
      managedUserProfileImageUrl: invitation.managedUserProfileImageUrl,
      managerUserId: invitation.managerUserId,
      managerDisplayName: invitation.managerDisplayName,
      managerEmail: invitation.managerEmail,
      managerProfileImageUrl: invitation.managerProfileImageUrl,
      status: ManagerRelationshipStatus.Active,
      createdAt: timestamp,
      updatedAt: timestamp,
      endedAt: null,
      endedByUserId: null,
    });

    await batch.commit();
  }

  async declineInvitation(invitationId: string): Promise<void> {
    const currentUserId = await this.auth.currentUserId();
    const invitation = await this.invitationSnapshot(invitationId);

    this.assertPendingInvitationForManager(invitation, currentUserId);
    await this.updateInvitationStatus(
      invitation.id,
      ManagerInvitationStatus.Declined,
    );
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    const currentUserId = await this.auth.currentUserId();
    const invitation = await this.invitationSnapshot(invitationId);

    if (
      invitation.managedUserId !== currentUserId ||
      invitation.status !== ManagerInvitationStatus.Pending
    ) {
      throw new Error('Only the inviting user can cancel a pending invitation');
    }

    await this.updateInvitationStatus(
      invitation.id,
      ManagerInvitationStatus.Cancelled,
    );
  }

  async removeManager(relationshipId: string): Promise<void> {
    const currentUserId = await this.auth.currentUserId();
    const relationship = await this.relationshipSnapshot(relationshipId);

    if (relationship.managedUserId !== currentUserId) {
      throw new Error('Only the sponsored user can remove this sponsor');
    }

    await this.endRelationship(relationship, currentUserId);
  }

  async stopManaging(relationshipId: string): Promise<void> {
    const currentUserId = await this.auth.currentUserId();
    const relationship = await this.relationshipSnapshot(relationshipId);

    if (relationship.managerUserId !== currentUserId) {
      throw new Error('Only the sponsor can stop sponsoring this user');
    }

    await this.endRelationship(relationship, currentUserId);
  }

  private pendingInvitationsForManager$(
    managerUserId: string,
  ): Observable<ManagerInvitation[]> {
    return this.invitationsQuery$([
      where('managerUserId', '==', managerUserId),
      where('status', '==', ManagerInvitationStatus.Pending),
    ]);
  }

  private pendingInvitationsFromManagedUser$(
    managedUserId: string,
  ): Observable<ManagerInvitation[]> {
    return this.invitationsQuery$([
      where('managedUserId', '==', managedUserId),
      where('status', '==', ManagerInvitationStatus.Pending),
    ]);
  }

  private activeManagersForUser$(
    managedUserId: string,
  ): Observable<ManagerRelationship[]> {
    return this.relationshipsQuery$([
      where('managedUserId', '==', managedUserId),
      where('status', '==', ManagerRelationshipStatus.Active),
    ]);
  }

  private activeManagedUsersForManager$(
    managerUserId: string,
  ): Observable<ManagerRelationship[]> {
    return this.relationshipsQuery$([
      where('managerUserId', '==', managerUserId),
      where('status', '==', ManagerRelationshipStatus.Active),
    ]);
  }

  private invitationsQuery$(filters: ReturnType<typeof where>[]): Observable<ManagerInvitation[]> {
    const invitationsQuery = query(
      collection(this.firestore, FirebaseCollection.ManagerInvitations),
      ...filters,
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

  private relationshipsQuery$(
    filters: ReturnType<typeof where>[],
  ): Observable<ManagerRelationship[]> {
    const relationshipsQuery = query(
      collection(this.firestore, FirebaseCollection.ManagerRelationships),
      ...filters,
    );

    return collectionData(relationshipsQuery).pipe(
      map((relationships) =>
        relationships
          .map((relationship) =>
            this.toManagerRelationship(relationship as Record<string, unknown>),
          )
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      ),
    );
  }

  private async assertNoDuplicateActiveOrPendingRelationship(
    managedUserId: string,
    managerUserId: string,
  ): Promise<void> {
    const [pendingInvitations, activeRelationships] = await Promise.all([
      this.pendingInvitationSnapshots(managedUserId, managerUserId),
      this.activeRelationshipSnapshots(managedUserId, managerUserId),
    ]);

    if (pendingInvitations.size > 0 || activeRelationships.size > 0) {
      throw new Error('A pending or active sponsor relationship already exists');
    }
  }

  private async assertNoActiveRelationship(
    managedUserId: string,
    managerUserId: string,
  ): Promise<void> {
    const activeRelationships = await this.activeRelationshipSnapshots(
      managedUserId,
      managerUserId,
    );

    if (activeRelationships.size > 0) {
      throw new Error('An active sponsor relationship already exists');
    }
  }

  private pendingInvitationSnapshots(
    managedUserId: string,
    managerUserId: string,
  ) {
    return getDocs(
      query(
        collection(this.firestore, FirebaseCollection.ManagerInvitations),
        where('managedUserId', '==', managedUserId),
        where('managerUserId', '==', managerUserId),
        where('status', '==', ManagerInvitationStatus.Pending),
      ),
    );
  }

  private activeRelationshipSnapshots(
    managedUserId: string,
    managerUserId: string,
  ) {
    return getDocs(
      query(
        collection(this.firestore, FirebaseCollection.ManagerRelationships),
        where('managedUserId', '==', managedUserId),
        where('managerUserId', '==', managerUserId),
        where('status', '==', ManagerRelationshipStatus.Active),
      ),
    );
  }

  private async invitationSnapshot(invitationId: string): Promise<ManagerInvitation> {
    const snapshot = await getDoc(this.invitationRef(invitationId));

    if (!snapshot.exists()) {
      throw new Error('Sponsor invitation not found');
    }

    return this.toManagerInvitation(snapshot.data() as Record<string, unknown>);
  }

  private async relationshipSnapshot(
    relationshipId: string,
  ): Promise<ManagerRelationship> {
    const snapshot = await getDoc(this.relationshipRef(relationshipId));

    if (!snapshot.exists()) {
      throw new Error('Sponsor relationship not found');
    }

    return this.toManagerRelationship(snapshot.data() as Record<string, unknown>);
  }

  private assertPendingInvitationForManager(
    invitation: ManagerInvitation,
    currentUserId: string,
  ): void {
    if (
      invitation.managerUserId !== currentUserId ||
      invitation.status !== ManagerInvitationStatus.Pending
    ) {
      throw new Error('Only the invited sponsor can act on this invitation');
    }
  }

  private updateInvitationStatus(
    invitationId: string,
    status: ManagerInvitationStatus,
  ): Promise<void> {
    return updateDoc(this.invitationRef(invitationId), {
      status,
      updatedAt: Timestamp.now(),
    });
  }

  private endRelationship(
    relationship: ManagerRelationship,
    endedByUserId: string,
  ): Promise<void> {
    if (relationship.status !== ManagerRelationshipStatus.Active) {
      throw new Error('Only active relationships can be ended');
    }

    return updateDoc(this.relationshipRef(relationship.id), {
      status: ManagerRelationshipStatus.Removed,
      updatedAt: Timestamp.now(),
      endedAt: Timestamp.now(),
      endedByUserId,
    });
  }

  private invitationRef(invitationId: string) {
    return doc(this.firestore, FirebaseCollection.ManagerInvitations, invitationId);
  }

  private relationshipRef(relationshipId: string) {
    return doc(
      this.firestore,
      FirebaseCollection.ManagerRelationships,
      relationshipId,
    );
  }

  private relationshipPairId(managedUserId: string, managerUserId: string): string {
    return `${managedUserId}_${managerUserId}`;
  }

  private toManagerInvitation(
    invitation: Record<string, unknown>,
  ): ManagerInvitation {
    return {
      id: this.toStringField(invitation, 'id'),
      managedUserId: this.toStringField(invitation, 'managedUserId'),
      managedUserDisplayName: this.toStringField(invitation, 'managedUserDisplayName'),
      managedUserEmail: this.toStringField(invitation, 'managedUserEmail'),
      managedUserProfileImageUrl: this.toStringField(
        invitation,
        'managedUserProfileImageUrl',
      ),
      managerUserId: this.toStringField(invitation, 'managerUserId'),
      managerDisplayName: this.toStringField(invitation, 'managerDisplayName'),
      managerEmail: this.toStringField(invitation, 'managerEmail'),
      managerProfileImageUrl: this.toStringField(invitation, 'managerProfileImageUrl'),
      status: this.toInvitationStatus(invitation['status']),
      createdAt: this.toDate(invitation['createdAt']),
      updatedAt: this.toDate(invitation['updatedAt']),
    };
  }

  private toManagerRelationship(
    relationship: Record<string, unknown>,
  ): ManagerRelationship {
    return {
      id: this.toStringField(relationship, 'id'),
      managedUserId: this.toStringField(relationship, 'managedUserId'),
      managedUserDisplayName: this.toStringField(
        relationship,
        'managedUserDisplayName',
      ),
      managedUserEmail: this.toStringField(relationship, 'managedUserEmail'),
      managedUserProfileImageUrl: this.toStringField(
        relationship,
        'managedUserProfileImageUrl',
      ),
      managerUserId: this.toStringField(relationship, 'managerUserId'),
      managerDisplayName: this.toStringField(relationship, 'managerDisplayName'),
      managerEmail: this.toStringField(relationship, 'managerEmail'),
      managerProfileImageUrl: this.toStringField(
        relationship,
        'managerProfileImageUrl',
      ),
      status: this.toRelationshipStatus(relationship['status']),
      createdAt: this.toDate(relationship['createdAt']),
      updatedAt: this.toDate(relationship['updatedAt']),
      endedAt: this.toNullableDate(relationship['endedAt']),
      endedByUserId: this.toNullableString(relationship['endedByUserId']),
    };
  }

  private toInvitationStatus(value: unknown): ManagerInvitationStatus {
    if (
      value === ManagerInvitationStatus.Pending ||
      value === ManagerInvitationStatus.Accepted ||
      value === ManagerInvitationStatus.Declined ||
      value === ManagerInvitationStatus.Cancelled
    ) {
      return value;
    }

    throw new Error('Invalid sponsor invitation status');
  }

  private toRelationshipStatus(value: unknown): ManagerRelationshipStatus {
    if (
      value === ManagerRelationshipStatus.Active ||
      value === ManagerRelationshipStatus.Removed
    ) {
      return value;
    }

    throw new Error('Invalid sponsor relationship status');
  }

  private toStringField(
    value: Record<string, unknown>,
    fieldName: string,
  ): string {
    const fieldValue = value[fieldName];

    if (typeof fieldValue === 'string') {
      return fieldValue;
    }

    throw new Error(`Invalid sponsor relationship field ${fieldName}`);
  }

  private toNullableString(value: unknown): string | null {
    if (value === null) {
      return null;
    }

    if (typeof value === 'string') {
      return value;
    }

    throw new Error('Invalid nullable sponsor relationship field');
  }

  private toDate(value: unknown): Date {
    if (value instanceof Timestamp) {
      return value.toDate();
    }

    throw new Error('Invalid sponsor relationship timestamp');
  }

  private toNullableDate(value: unknown): Date | null {
    if (value === null) {
      return null;
    }

    return this.toDate(value);
  }
}

function switchLatestOrEmpty<T>() {
  return (source: Observable<Observable<T[]> | null>): Observable<T[]> =>
    source.pipe(switchMap((value) => value ?? of([])));
}
