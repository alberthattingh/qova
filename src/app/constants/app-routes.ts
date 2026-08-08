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
  Settings = 'settings',
  Wildcard = '**',
}

export enum RouteParam {
  CommitmentId = 'commitmentId',
}

export const ABSOLUTE_ROUTES = {
  login: `/${AppRoutePath.Login}`,
  register: `/${AppRoutePath.Register}`,
  userDashboard: `/${AppRoutePath.UserDashboard}`,
  managerDashboard: `/${AppRoutePath.ManagerDashboard}`,
  managers: `/${AppRoutePath.Managers}`,
  commitments: `/${AppRoutePath.Commitments}`,
  checkIns: `/${AppRoutePath.CheckIns}`,
  reviewQueue: `/${AppRoutePath.ReviewQueue}`,
  settings: `/${AppRoutePath.Settings}`,
} as const;
