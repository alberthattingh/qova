import { Commitment } from './commitment.model';
import { ManagerRelationship } from './manager-relationship.model';

export interface CommitmentWorkspace {
  activeCommitments: Commitment[];
  draftCommitments: Commitment[];
  completedCommitments: Commitment[];
  managerCommitments: Commitment[];
  availableManagers: ManagerRelationship[];
}
