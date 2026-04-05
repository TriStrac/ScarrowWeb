import { Routes } from '@angular/router';
import { LoginComponent } from './pages';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { DeviceComponent } from './pages/device/device';
import { SingleDeviceComponent } from './pages/device/singledevice/singledevice';
import { DeviceLinkedNodesComponent } from './pages/device/device-linked-nodes/device-linked-nodes';
import { ActivityLogsComponent } from './pages/activitylogs/activitylogs';
import { FarmersComponent } from './pages/farmers/farmers';
import { ProfileComponent } from './pages/profile/profile';
import { ReportComponent } from './pages/reports/reports';
import { SingleuserComponent } from './pages/farmers/singleuserpage/singleuser';
import { SubscriptionsComponent } from './pages/subscriptions/subscriptions';
import { OrganizationComponent } from './pages/organization/organization';
import { MessagesComponent } from './pages/messages/messages';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'organization', component: OrganizationComponent },
      { path: 'messages', component: MessagesComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'device', component: DeviceComponent },
      { path: 'device/:id/nodes', component: DeviceLinkedNodesComponent },
      { path: 'device/:id', component: SingleDeviceComponent },
      { path: 'activitylogs', component: ActivityLogsComponent },
      { path: 'farmers', component: FarmersComponent },
      { path: 'farmer/:id', component: SingleuserComponent },
      { path: 'reports', component: ReportComponent },
      { path: 'subscriptions', component: SubscriptionsComponent },
    ],
  },
];
