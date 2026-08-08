import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { CardModule } from 'primeng/card';

import { UpdateUserProfile } from '../../../models/update-user-profile.model';
import { NotificationService } from '../../../services/notifications/notification.service';
import { ProfileService } from '../../../services/profile/profile.service';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { ProfileSettingsForm } from '../profile-settings-form/profile-settings-form';

@Component({
  selector: 'app-settings-page',
  imports: [
    AsyncPipe,
    CardModule,
    LoadingState,
    ProfileSettingsForm,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {
  private readonly notifications = inject(NotificationService);
  private readonly profileService = inject(ProfileService);

  protected readonly currentProfile$ = this.profileService.currentProfile$;
  protected readonly isSaving = signal(false);

  async updateProfile(profile: UpdateUserProfile): Promise<void> {
    this.isSaving.set(true);

    try {
      await this.profileService.updateCurrentUserProfile(profile);
      this.notifications.success('Profile saved', 'Your profile has been updated.');
    } catch {
      this.notifications.error(
        'Unable to save profile',
        'We could not update your profile. Please try again.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }
}
