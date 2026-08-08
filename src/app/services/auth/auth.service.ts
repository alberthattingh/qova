import { Injectable, inject } from '@angular/core';
import {
  Auth,
  browserLocalPersistence,
  authState,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from '@angular/fire/auth';
import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs';

import { AuthStatus } from '../../constants/auth-statuses';
import { AppUser } from '../../models/app-user.model';
import { AuthSession } from '../../models/auth-session.model';
import { LoginCredentials } from '../../models/login-credentials.model';
import { RegistrationCredentials } from '../../models/registration-credentials.model';
import { UserProfile } from '../../models/user-profile.model';
import { ProfileImageSource } from '../../constants/avatar';
import { DashboardRoutingService } from '../navigation/dashboard-routing.service';
import { UserService } from '../user/user.service';
import { AvatarService } from '../profile/avatar.service';
import { ProfileImageStorageService } from '../profile/profile-image-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly avatars = inject(AvatarService);
  private readonly dashboardRouting = inject(DashboardRoutingService);
  private readonly profileImages = inject(ProfileImageStorageService);
  private readonly users = inject(UserService);
  private readonly statusSubject = new BehaviorSubject<AuthStatus>(AuthStatus.Idle);
  private readonly persistenceReady = setPersistence(this.auth, browserLocalPersistence);

  readonly authStatus$ = this.statusSubject.asObservable();

  readonly currentAuthSession$: Observable<AuthSession | null> = authState(this.auth).pipe(
    map((user) =>
      user
        ? {
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            profileImageUrl: user.photoURL,
          }
        : null,
    ),
    tap((session) =>
      this.statusSubject.next(
        session ? AuthStatus.Authenticated : AuthStatus.Unauthenticated,
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly currentUserProfile$: Observable<UserProfile | null> =
    this.currentAuthSession$.pipe(
      switchMap((session) =>
        session
          ? this.users.profile$(session.id).pipe(
              map((profile) => {
                if (!profile) {
                  throw new Error('User profile not found');
                }

                return profile;
              }),
            )
          : of(null),
      ),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  readonly currentUser$: Observable<AppUser | null> = this.currentUserProfile$.pipe(
    map((profile) =>
      profile
        ? {
            id: profile.id,
            email: profile.email,
            displayName: profile.displayName,
            profileImageUrl: profile.profileImageUrl,
          }
        : null,
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly isAuthenticated$: Observable<boolean> = this.currentAuthSession$.pipe(
    map((session) => session !== null),
    distinctUntilChanged(),
  );

  async signIn(credentials: LoginCredentials): Promise<void> {
    await this.withAuthStatus(async () => {
      await this.persistenceReady;
      await signInWithEmailAndPassword(
        this.auth,
        credentials.email.trim().toLowerCase(),
        credentials.password,
      );
    });
  }

  async register(credentials: RegistrationCredentials): Promise<void> {
    await this.withAuthStatus(async () => {
      await this.persistenceReady;
      const email = credentials.email.trim().toLowerCase();
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        credentials.password,
      );
      const displayName = credentials.displayName.trim();
      const profileImageUrl = credentials.profileImage
        ? await this.profileImages.uploadProfileImage(
            userCredential.user.uid,
            credentials.profileImage,
          )
        : this.avatars.generatedAvatarUrl(displayName);
      const profileImageSource = credentials.profileImage
        ? ProfileImageSource.Uploaded
        : ProfileImageSource.Generated;

      await updateProfile(userCredential.user, {
        displayName,
        photoURL: profileImageUrl,
      });
      await this.users.createProfile({
        id: userCredential.user.uid,
        displayName,
        email,
        profileImageUrl,
        profileImageSource,
      });
    });
  }

  async updateAuthProfile(displayName: string, profileImageUrl: string): Promise<void> {
    await this.withAuthStatus(async () => {
      if (!this.auth.currentUser) {
        throw new Error(AuthStatus.Unauthenticated);
      }

      await updateProfile(this.auth.currentUser, {
        displayName,
        photoURL: profileImageUrl,
      });
    });
  }

  async signOut(): Promise<void> {
    await this.withAuthStatus(async () => {
      await signOut(this.auth);
    });
  }

  dashboardRouteForCurrentUser$(): Observable<string> {
    return this.currentUser$.pipe(
      filter((user): user is AppUser => user !== null),
      take(1),
      map(() => this.dashboardRouting.defaultDashboard()),
    );
  }

  async currentUserId(): Promise<string> {
    const session = await firstValueFrom(
      this.currentAuthSession$.pipe(
        filter((value): value is AuthSession => value !== null),
        take(1),
      ),
    );

    return session.id;
  }

  private async withAuthStatus(action: () => Promise<void>): Promise<void> {
    this.statusSubject.next(AuthStatus.Loading);

    try {
      await action();
      this.statusSubject.next(
        this.auth.currentUser ? AuthStatus.Authenticated : AuthStatus.Unauthenticated,
      );
    } catch (error) {
      this.statusSubject.next(AuthStatus.Error);
      throw error;
    }
  }
}
