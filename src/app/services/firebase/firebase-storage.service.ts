import { Injectable, inject } from '@angular/core';
import { ref, Storage } from '@angular/fire/storage';

import { FirebaseStoragePath } from '../../constants/firebase-storage-paths';

@Injectable({
  providedIn: 'root',
})
export class FirebaseStorageService {
  private readonly storage = inject(Storage);

  userUploadPath(userId: string, fileName: string): string {
    return `${FirebaseStoragePath.UserUploads}/${userId}/${fileName}`;
  }

  commitmentEvidencePath(commitmentId: string, fileName: string): string {
    return `${FirebaseStoragePath.CommitmentEvidence}/${commitmentId}/${fileName}`;
  }

  storageRef(path: string) {
    return ref(this.storage, path);
  }
}
