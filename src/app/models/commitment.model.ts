import { CommitmentStatus } from '../constants/commitment-statuses';

export interface Commitment {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  status: CommitmentStatus;
  dueDate?: Date;
}
