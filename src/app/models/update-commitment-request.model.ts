import { CreateCommitmentRequest } from './create-commitment-request.model';

export interface UpdateCommitmentRequest extends CreateCommitmentRequest {
  commitmentId: string;
}
