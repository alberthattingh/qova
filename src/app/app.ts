import { Component, signal } from '@angular/core';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [BadgeModule, ButtonModule, CardModule, DividerModule, RouterOutlet, TagModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('qova');

  protected readonly firebaseServices = [
    { name: 'Authentication', icon: 'pi pi-shield', severity: 'success' },
    { name: 'Cloud Firestore', icon: 'pi pi-database', severity: 'info' },
    { name: 'Cloud Storage', icon: 'pi pi-folder', severity: 'warn' },
    { name: 'Cloud Functions', icon: 'pi pi-bolt', severity: 'success' },
    { name: 'Firebase Hosting', icon: 'pi pi-globe', severity: 'info' },
  ];
}
