import { Injectable, inject } from '@angular/core';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';
import { map, Observable, shareReplay } from 'rxjs';

import { AuthSession } from '../../models/auth-session.model';

@Injectable({
  providedIn: 'root',
})
export class FirebaseAuthService {
  private readonly auth = inject(Auth);

  readonly user$: Observable<AuthSession | null> = authState(this.auth).pipe(
    map((user) =>
      user
        ? {
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
          }
        : null,
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  signIn(email: string, password: string): Promise<unknown> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  register(email: string, password: string): Promise<unknown> {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  signOut(): Promise<void> {
    return signOut(this.auth);
  }
}
