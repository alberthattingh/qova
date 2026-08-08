import { Commitment } from './commitment.model';
import { ManagerRelationship } from './manager-relationship.model';
import { ManagedCommitment } from './managed-commitment.model';

export interface CommitmentWorkspace {
  activeCommitments: Commitment[];
  draftCommitments: Commitment[];
  completedCommitments: Commitment[];
  managerCommitments: ManagedCommitment[];
  availableManagers: ManagerRelationship[];
}
