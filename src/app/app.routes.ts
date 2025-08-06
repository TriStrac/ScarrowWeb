import { Routes } from '@angular/router';
import { LoginComponent, SignupComponent , DashboardComponent, DeviceComponent} from './pages';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'device', component: DeviceComponent },
];
