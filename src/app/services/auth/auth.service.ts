import { Injectable, inject } from '@angular/core';
import { filter, map, Observable, of, shareReplay, switchMap, take } from 'rxjs';

import { UserRole } from '../../constants/user-roles';
import { AppUser } from '../../models/app-user.model';
import { AuthSession } from '../../models/auth-session.model';
import { FirebaseAuthService } from '../firebase/firebase-auth.service';
import { FirebaseUserProfileService } from '../firebase/firebase-user-profile.service';
import { DashboardRoutingService } from '../navigation/dashboard-routing.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly firebaseAuth = inject(FirebaseAuthService);
  private readonly dashboardRouting = inject(DashboardRoutingService);
  private readonly profiles = inject(FirebaseUserProfileService);

  readonly currentUser$: Observable<AppUser | null> = this.firebaseAuth.user$.pipe(
    switchMap((user) => this.toAppUser$(user)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly isAuthenticated$: Observable<boolean> = this.currentUser$.pipe(
    map((user) => user !== null),
  );

  signIn(email: string, password: string): Promise<unknown> {
    return this.firebaseAuth.signIn(email, password);
  }

  register(email: string, password: string): Promise<unknown> {
    return this.firebaseAuth.register(email, password);
  }

  signOut(): Promise<void> {
    return this.firebaseAuth.signOut();
  }

  dashboardRouteForCurrentUser$(): Observable<string> {
    return this.currentUser$.pipe(
      filter((user): user is AppUser => user !== null),
      take(1),
      map((user) => this.dashboardRouting.dashboardForRole(user.role)),
    );
  }

  private toAppUser$(user: AuthSession | null): Observable<AppUser | null> {
    if (!user) {
      return of(null);
    }

    return this.profiles.profile$(user.id).pipe(
      map((profile) => ({
        id: user.id,
        email: profile?.email ?? user.email,
        displayName: profile?.displayName ?? user.displayName,
        role: profile?.role ?? UserRole.User,
      })),
    );
  }
}
