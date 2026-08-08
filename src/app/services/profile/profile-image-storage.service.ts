import { Injectable, inject } from '@angular/core';
import { Storage, getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';

import { FirebaseStoragePath } from '../../constants/firebase-storage-paths';

@Injectable({
  providedIn: 'root',
})
export class ProfileImageStorageService {
  private readonly storage = inject(Storage);

  async uploadProfileImage(userId: string, file: File): Promise<string> {
    const path = this.profileImagePath(userId, file.name);
    const storageReference = ref(this.storage, path);
    const result = await uploadBytes(storageReference, file, {
      contentType: file.type,
    });

    return getDownloadURL(result.ref);
  }

  private profileImagePath(userId: string, fileName: string): string {
    return `${FirebaseStoragePath.UserUploads}/${userId}/${FirebaseStoragePath.ProfilePictures}/${fileName}`;
  }
}
