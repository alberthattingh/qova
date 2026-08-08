export enum AppRoutePath {
  Root = '',
  Login = 'login',
  Register = 'register',
  UserDashboard = 'dashboard',
  ManagerDashboard = 'manager-dashboard',
  Managers = 'managers',
  Commitments = 'commitments',
  CommitmentDetails = 'commitments/:commitmentId',
  CheckIns = 'check-ins',
  ReviewQueue = 'review-queue',
  ReviewDetails = 'review-queue/:checkInId',
  Settings = 'settings',
  Wildcard = '**',
}

export enum RouteParam {
  CommitmentId = 'commitmentId',
  CheckInId = 'checkInId',
}

export const ABSOLUTE_ROUTES = {
  login: `/${AppRoutePath.Login}`,
  register: `/${AppRoutePath.Register}`,
  userDashboard: `/${AppRoutePath.UserDashboard}`,
  managerDashboard: `/${AppRoutePath.ManagerDashboard}`,
  managers: `/${AppRoutePath.Managers}`,
  commitments: `/${AppRoutePath.Commitments}`,
  commitmentDetails: (commitmentId: string) =>
    `/${AppRoutePath.Commitments}/${commitmentId}`,
  checkIns: `/${AppRoutePath.CheckIns}`,
  reviewQueue: `/${AppRoutePath.ReviewQueue}`,
  reviewDetails: (checkInId: string) =>
    `/${AppRoutePath.ReviewQueue}/${checkInId}`,
  settings: `/${AppRoutePath.Settings}`,
} as const;
