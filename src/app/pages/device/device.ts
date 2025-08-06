import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-device',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './device.html',
  styleUrls: ['./device.css']
})
export class DeviceComponent {}
