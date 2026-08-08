import { Injectable, inject } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, filter, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationLoadingService {
  private readonly router = inject(Router);
  private readonly isLoadingSubject = new BehaviorSubject(false);

  readonly isLoading$ = this.isLoadingSubject.asObservable().pipe(
    distinctUntilChanged(),
  );

  constructor() {
    this.router.events.pipe(
      filter(
        (
          event,
        ): event is
          | NavigationStart
          | NavigationEnd
          | NavigationCancel
          | NavigationError =>
          event instanceof NavigationStart ||
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError,
      ),
      map((event) => event instanceof NavigationStart),
    ).subscribe((isLoading) => this.isLoadingSubject.next(isLoading));
  }
}
