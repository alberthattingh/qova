import { Injectable, inject } from '@angular/core';
import { Storage, uploadBytes, ref } from '@angular/fire/storage';

import {
  CHECK_IN_EVIDENCE_MAX_FILE_SIZE_BYTES,
  CheckInEvidenceFileCategory,
} from '../../constants/check-in-evidence-file-types';
import { FirebaseStoragePath } from '../../constants/firebase-storage-paths';
import { UploadedCheckInEvidence } from '../../models/uploaded-check-in-evidence.model';

@Injectable({
  providedIn: 'root',
})
export class CheckInEvidenceStorageService {
  private readonly storage = inject(Storage);

  async uploadEvidenceFile(
    ownerUserId: string,
    checkInId: string,
    evidenceId: string,
    file: File,
  ): Promise<UploadedCheckInEvidence> {
    const category = this.fileCategory(file);
    const path = this.evidencePath(ownerUserId, checkInId, evidenceId, file.name);
    const storageReference = ref(this.storage, path);

    await uploadBytes(storageReference, file, {
      contentType: file.type,
    });

    return {
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      storagePath: path,
      category,
    };
  }

  fileCategory(file: File): CheckInEvidenceFileCategory {
    if (file.type.startsWith('image/')) {
      this.assertAllowedSize(file);
      return CheckInEvidenceFileCategory.Image;
    }

    if (file.type === 'application/pdf') {
      this.assertAllowedSize(file);
      return CheckInEvidenceFileCategory.Pdf;
    }

    throw new Error('Evidence must be an image or PDF');
  }

  private evidencePath(
    ownerUserId: string,
    checkInId: string,
    evidenceId: string,
    fileName: string,
  ): string {
    return `${FirebaseStoragePath.CheckInEvidence}/${ownerUserId}/${checkInId}/${evidenceId}-${this.safeFileName(fileName)}`;
  }

  private assertAllowedSize(file: File): void {
    if (file.size > CHECK_IN_EVIDENCE_MAX_FILE_SIZE_BYTES) {
      throw new Error('Evidence files must be 10 MB or smaller');
    }
  }

  private safeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  }
}
