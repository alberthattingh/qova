import { Component } from '@angular/core';

import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-user-dashboard-page',
  imports: [EmptyState],
  templateUrl: './user-dashboard-page.html',
  styleUrl: './user-dashboard-page.scss',
})
export class UserDashboardPage {}
