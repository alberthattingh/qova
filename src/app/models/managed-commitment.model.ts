import { CommitmentOwner } from './commitment-owner.model';
import { Commitment } from './commitment.model';

export interface ManagedCommitment {
  commitment: Commitment;
  owner: CommitmentOwner;
}
