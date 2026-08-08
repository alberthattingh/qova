import { Component } from '@angular/core';

import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-settings-page',
  imports: [EmptyState],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {}
