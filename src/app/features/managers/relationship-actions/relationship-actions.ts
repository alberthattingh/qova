import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-relationship-actions',
  imports: [ButtonModule],
  templateUrl: './relationship-actions.html',
})
export class RelationshipActions {
  @Input() mode: 'manager' | 'managed-user' = 'manager';
  @Output() ended = new EventEmitter<void>();
}
