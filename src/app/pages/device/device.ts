import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-device',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device.html',
  styleUrls: ['./device.css']
})
export class DeviceComponent {
  constructor(private router: Router) {}

  goToDevice(id: string) {
    this.router.navigate(['/device', id]);
  }
}
