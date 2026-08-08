import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-error-state',
  imports: [ButtonModule],
  templateUrl: './error-state.html',
  styleUrl: './error-state.scss',
})
export class ErrorState {
  @Input() title = 'Something went wrong';
  @Input() message = 'Please try again.';
  @Input() actionLabel = 'Retry';
  @Input() showAction = true;
  @Output() action = new EventEmitter<void>();
}
