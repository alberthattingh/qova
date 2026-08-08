import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  Timestamp,
  doc,
  docData,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';

import { ProfileImageSource } from '../../constants/avatar';
import { FirebaseCollection } from '../../constants/firebase-collections';
import { CreateUserProfile } from '../../models/create-user-profile.model';
import { PersistUserProfileUpdate } from '../../models/persist-user-profile-update.model';
import { UserProfile } from '../../models/user-profile.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly firestore = inject(Firestore);

  profile$(userId: string): Observable<UserProfile | null> {
    const profileRef = this.profileRef(userId);

    return docData(profileRef).pipe(
      map((profile) =>
        profile ? this.toUserProfile(profile as Record<string, unknown>) : null,
      ),
    );
  }

  createProfile(profile: CreateUserProfile): Promise<void> {
    const timestamp = Timestamp.now();

    return setDoc(this.profileRef(profile.id), {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.email,
      profileImageUrl: profile.profileImageUrl,
      profileImageSource: profile.profileImageSource,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async profileSnapshot(userId: string): Promise<UserProfile> {
    const snapshot = await getDoc(this.profileRef(userId));

    if (!snapshot.exists()) {
      throw new Error('User profile not found');
    }

    return this.toUserProfile(snapshot.data() as Record<string, unknown>);
  }

  updateProfile(
    userId: string,
    profile: PersistUserProfileUpdate,
  ): Promise<void> {
    return updateDoc(this.profileRef(userId), {
      displayName: profile.displayName,
      profileImageUrl: profile.profileImageUrl,
      profileImageSource: profile.profileImageSource,
      updatedAt: Timestamp.now(),
    });
  }

  private profileRef(userId: string) {
    return doc(this.firestore, FirebaseCollection.Users, userId);
  }

  private toUserProfile(profile: Record<string, unknown>): UserProfile {
    return {
      id: this.toStringField(profile, 'id'),
      displayName: this.toStringField(profile, 'displayName'),
      email: this.toStringField(profile, 'email'),
      profileImageUrl: this.toStringField(profile, 'profileImageUrl'),
      profileImageSource: this.toProfileImageSource(profile['profileImageSource']),
      createdAt: this.toDate(profile['createdAt']),
      updatedAt: this.toDate(profile['updatedAt']),
    };
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

  private toStringField(
    profile: Record<string, unknown>,
    fieldName: keyof UserProfile,
  ): string {
    const value = profile[fieldName];

    if (typeof value === 'string') {
      return value;
    }

    throw new Error(`Invalid user profile ${fieldName}`);
  }

  private toDate(value: unknown): Date {
    if (value instanceof Timestamp) {
      return value.toDate();
    }

    throw new Error('Invalid user profile timestamp');
  }
}
