import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { CardModule } from 'primeng/card';

import { UpdateUserProfile } from '../../../models/update-user-profile.model';
import { ProfileService } from '../../../services/profile/profile.service';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { ProfileSettingsForm } from '../profile-settings-form/profile-settings-form';

@Component({
  selector: 'app-settings-page',
  imports: [
    AsyncPipe,
    CardModule,
    ErrorState,
    LoadingState,
    ProfileSettingsForm,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {
  private readonly profileService = inject(ProfileService);

  protected readonly currentProfile$ = this.profileService.currentProfile$;
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  async updateProfile(profile: UpdateUserProfile): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      await this.profileService.updateCurrentUserProfile(profile);
    } catch {
      this.errorMessage.set('We could not update your profile. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
