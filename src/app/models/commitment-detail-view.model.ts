import { CheckIn } from './check-in.model';
import { CommitmentVersion } from './commitment-version.model';
import { Commitment } from './commitment.model';

export interface CommitmentDetailView {
  commitment: Commitment;
  versions: CommitmentVersion[];
  checkIns: CheckIn[];
}
