import { Component } from '@angular/core';
import { DashboardComponent } from './dashboard/dashboard';
DashboardComponent;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardComponent],
  template: `<app-dashboard></app-dashboard>`,
})
export class AppComponent {}
