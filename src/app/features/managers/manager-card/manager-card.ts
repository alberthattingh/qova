import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { ManagerRelationship } from '../../../models/manager-relationship.model';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { RelationshipActions } from '../relationship-actions/relationship-actions';

@Component({
  selector: 'app-manager-card-list',
  imports: [CardModule, EmptyState, RelationshipActions, TagModule],
  templateUrl: './manager-card.html',
  styleUrl: './manager-card.scss',
})
export class ManagerCard {
  @Input() relationships: ManagerRelationship[] = [];
  @Input() mode: 'manager' | 'managed-user' = 'manager';
  @Input() emptyTitle = 'No relationships';
  @Input() emptyMessage = 'Active sponsor relationships will appear here.';

  @Output() relationshipEnded = new EventEmitter<string>();
}
