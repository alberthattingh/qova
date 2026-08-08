import { CheckInEvidenceFileCategory } from '../constants/check-in-evidence-file-types';

export interface EvidenceFilePreview {
  id: string;
  file: File;
  fileName: string;
  size: number;
  category: CheckInEvidenceFileCategory;
  previewUrl: string;
}
