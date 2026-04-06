import { Routes } from '@angular/router';
import { LoginComponent } from './pages';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { DeviceComponent } from './pages/device/device';
import { DeviceLinkedNodesComponent } from './pages/device/device-linked-nodes/device-linked-nodes';
import { SingleDeviceComponent } from './pages/device/singledevice/singledevice';
import { ActivityLogsComponent } from './pages/activitylogs/activitylogs';
import { FarmersComponent } from './pages/farmers/farmers';
import { MessagesComponent } from './pages/messages/messages';
import { OrganizationComponent } from './pages/organization/organization';
import { ProfileComponent } from './pages/profile/profile';
import { ReportComponent } from './pages/reports/reports';
// Update the import path to match the actual file location and name
import { SingleuserComponent } from './pages/farmers/singleuserpage/singleuser';
import { SubscriptionsComponent } from './pages/subscriptions/subscriptions';



export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', redirectTo: '/login', pathMatch: 'full' },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'organization', component: OrganizationComponent },
      { path: 'messages', component: MessagesComponent },
      { path: 'device', component: DeviceComponent },
      { path: 'device/:id/nodes', component: DeviceLinkedNodesComponent },
      { path: 'device/:id', component: SingleDeviceComponent },
      { path: 'activitylogs', redirectTo: '/farmers', pathMatch: 'full' },
      { path: 'activitylogs/:farmerId', component: ActivityLogsComponent },
      { path: 'farmers', component: FarmersComponent },
      { path: 'farmer/:id', component: SingleuserComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'reports', component: ReportComponent },
      { path: 'subscriptions', component: SubscriptionsComponent }
    ]
  }
];
