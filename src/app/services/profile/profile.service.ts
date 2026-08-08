import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ProfileImageSource } from '../../constants/avatar';
import { UpdateUserProfile } from '../../models/update-user-profile.model';
import { UserProfile } from '../../models/user-profile.model';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { AvatarService } from './avatar.service';
import { ProfileImageStorageService } from './profile-image-storage.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly auth = inject(AuthService);
  private readonly avatars = inject(AvatarService);
  private readonly profileImages = inject(ProfileImageStorageService);
  private readonly users = inject(UserService);

  readonly currentProfile$: Observable<UserProfile | null> =
    this.auth.currentUserProfile$;

  async updateCurrentUserProfile(profile: UpdateUserProfile): Promise<void> {
    const displayName = profile.displayName.trim();
    const userId = await this.auth.currentUserId();
    const currentProfile = await this.users.profileSnapshot(userId);
    const profileImageUrl = profile.profileImage
      ? await this.profileImages.uploadProfileImage(userId, profile.profileImage)
      : this.profileImageUrlForDisplayName(displayName, currentProfile);
    const profileImageSource = profile.profileImage
      ? ProfileImageSource.Uploaded
      : currentProfile.profileImageSource;

    await this.users.updateProfile(userId, {
      displayName,
      profileImageSource,
      profileImageUrl,
    });
    await this.auth.updateAuthProfile(displayName, profileImageUrl);
  }

  private profileImageUrlForDisplayName(
    displayName: string,
    currentProfile: UserProfile,
  ): string {
    return currentProfile.profileImageSource === ProfileImageSource.Generated
      ? this.avatars.generatedAvatarUrl(displayName)
      : currentProfile.profileImageUrl;
  }
}
