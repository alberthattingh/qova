import { CommitmentTerms } from './commitment-terms.model';

export interface CommitmentVersion extends CommitmentTerms {
  id: string;
  commitmentId: string;
  ownerUserId: string;
  versionNumber: number;
  createdAt: Date;
  createdByUserId: string;
}
