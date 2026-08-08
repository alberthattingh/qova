import { Injectable } from '@angular/core';

import { DICEBEAR_AVATAR_BASE_URL } from '../../constants/avatar';

@Injectable({
  providedIn: 'root',
})
export class AvatarService {
  generatedAvatarUrl(displayName: string): string {
    const seed = encodeURIComponent(displayName.trim());

    return `${DICEBEAR_AVATAR_BASE_URL}?seed=${seed}`;
  }
}
