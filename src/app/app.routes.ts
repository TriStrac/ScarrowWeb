import { Routes } from '@angular/router';
import { LoginComponent, SignupComponent } from './pages';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { DeviceComponent } from './pages/device/device';
import { SingledeviceComponent } from './pages/device/singledevice/singledevice';
import { ActivitylogComponent } from './pages/activitylogs/activitylogs';


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
      { path: 'device/:id', component: SingledeviceComponent },
      { path: 'activitylogs', component: ActivitylogComponent },
    ]
  }
];
