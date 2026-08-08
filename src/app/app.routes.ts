import { Routes } from '@angular/router';

import { AppRoutePath } from './constants/app-routes';
import { authChildGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: AppRoutePath.Root,
    pathMatch: 'full',
    redirectTo: AppRoutePath.Login,
  },
  {
    path: AppRoutePath.Login,
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login-page/login-page').then(
        (component) => component.LoginPage,
      ),
  },
  {
    path: AppRoutePath.Register,
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register-page/register-page').then(
        (component) => component.RegisterPage,
      ),
  },
  {
    path: AppRoutePath.Root,
    loadComponent: () =>
      import('./layouts/authenticated-layout/authenticated-layout').then(
        (component) => component.AuthenticatedLayout,
      ),
    canActivateChild: [authChildGuard],
    children: [
      {
        path: AppRoutePath.UserDashboard,
        loadComponent: () =>
          import('./features/dashboard/user-dashboard-page/user-dashboard-page').then(
            (component) => component.UserDashboardPage,
          ),
      },
      {
        path: AppRoutePath.ManagerDashboard,
        loadComponent: () =>
          import(
            './features/dashboard/manager-dashboard-page/manager-dashboard-page'
          ).then((component) => component.ManagerDashboardPage),
      },
      {
        path: AppRoutePath.Managers,
        loadComponent: () =>
          import('./features/managers/managers-page/managers-page').then(
            (component) => component.ManagersPage,
          ),
      },
      {
        path: AppRoutePath.Commitments,
        loadComponent: () =>
          import('./features/commitments/commitments-page/commitments-page').then(
            (component) => component.CommitmentsPage,
          ),
      },
      {
        path: AppRoutePath.CommitmentDetails,
        loadComponent: () =>
          import(
            './features/commitments/commitment-details-page/commitment-details-page'
          ).then((component) => component.CommitmentDetailsPage),
      },
      {
        path: AppRoutePath.CheckIns,
        loadComponent: () =>
          import('./features/check-ins/check-ins-page/check-ins-page').then(
            (component) => component.CheckInsPage,
          ),
      },
      {
        path: AppRoutePath.ReviewQueue,
        loadComponent: () =>
          import('./features/review-queue/review-queue-page/review-queue-page').then(
            (component) => component.ReviewQueuePage,
          ),
      },
      {
        path: AppRoutePath.Settings,
        loadComponent: () =>
          import('./features/settings/settings-page/settings-page').then(
            (component) => component.SettingsPage,
          ),
      },
    ],
  },
  {
    path: AppRoutePath.Wildcard,
    redirectTo: AppRoutePath.Login,
  },
];
