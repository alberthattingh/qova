import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-empty-state',
  imports: [ButtonModule],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  @Input() icon = 'pi pi-inbox';
  @Input() title = 'Nothing here yet';
  @Input() message = 'Items will appear here when they are available.';
  @Input() actionLabel?: string;
  @Output() action = new EventEmitter<void>();
}
