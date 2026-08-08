import { Component, Input } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-loading-state',
  imports: [ProgressSpinnerModule],
  templateUrl: './loading-state.html',
  styleUrl: './loading-state.scss',
})
export class LoadingState {
  @Input() message = 'Loading';
}
