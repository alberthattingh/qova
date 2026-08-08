import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

import { NotificationSeverity } from '../../constants/notification-severity';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly messages = inject(MessageService);

  success(summary: string, detail: string): void {
    this.show(NotificationSeverity.Success, summary, detail);
  }

  error(summary: string, detail: string): void {
    this.show(NotificationSeverity.Error, summary, detail);
  }

  info(summary: string, detail: string): void {
    this.show(NotificationSeverity.Info, summary, detail);
  }

  warn(summary: string, detail: string): void {
    this.show(NotificationSeverity.Warn, summary, detail);
  }

  private show(
    severity: NotificationSeverity,
    summary: string,
    detail: string,
  ): void {
    this.messages.add({
      severity,
      summary,
      detail,
      life: 4500,
    });
  }
}
