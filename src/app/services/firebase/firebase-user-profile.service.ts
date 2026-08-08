import { Injectable, inject } from '@angular/core';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';

import { FirebaseCollection } from '../../constants/firebase-collections';
import { UserRole } from '../../constants/user-roles';
import { UserProfile } from '../../models/user-profile.model';

@Injectable({
  providedIn: 'root',
})
export class FirebaseUserProfileService {
  private readonly firestore = inject(Firestore);

  profile$(userId: string): Observable<UserProfile | null> {
    const profileRef = doc(this.firestore, FirebaseCollection.Users, userId);

    return docData(profileRef, { idField: 'id' }).pipe(
      map((profile) =>
        profile ? this.toUserProfile(profile as Record<string, unknown>) : null,
      ),
    );
  }

  private toUserProfile(profile: Record<string, unknown>): UserProfile {
    return {
      id: String(profile['id']),
      email: this.toNullableString(profile['email']),
      displayName: this.toNullableString(profile['displayName']),
      role: this.toUserRole(profile['role']),
    };
  }

  private toNullableString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  private toUserRole(value: unknown): UserRole {
    return value === UserRole.Manager ? UserRole.Manager : UserRole.User;
  }
}
