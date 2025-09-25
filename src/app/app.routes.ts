import { Routes } from '@angular/router';
import { LoginComponent, SignupComponent } from './pages';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { DeviceComponent } from './pages/device/device';
import { SingleDeviceComponent } from './pages/device/singledevice/singledevice';
import { ActivityLogsComponent } from './pages/activitylogs/activitylogs';
import { FarmersComponent } from './pages/farmers/farmers';
import { ProfileComponent } from './pages/profile/profile';
import { ReportComponent } from './pages/reports/reports';
// Update the import path to match the actual file location and name
import { SingleuserComponent } from './pages/farmers/singleuserpage/singleuser';
import { TermsConditionsComponent } from './pages/termsconditions/termscondition';
import { SubscriptionsComponent } from './pages/subscriptions/subscriptions';



export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'device', component: DeviceComponent },
      { path: 'device/:id', component: SingleDeviceComponent },
      { path: 'activitylogs', component: ActivityLogsComponent },
      { path: 'farmers', component: FarmersComponent },
      { path: 'farmer/:id', component: SingleuserComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'reports', component: ReportComponent },
      { path: 'termsconditions', component: TermsConditionsComponent },
      { path: 'subscriptions', component: SubscriptionsComponent }
    ]
  }
];
