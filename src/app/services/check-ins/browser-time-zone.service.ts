import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BrowserTimeZoneService {
  currentTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
}
