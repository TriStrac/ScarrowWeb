import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-singleuser',
  standalone: true,
  imports: [CommonModule], // ✅ fixes *ngIf and *ngFor errors
  templateUrl: './singleuser.html',
  styleUrls: ['./singleuser.css']
})
export class SingleuserComponent implements OnInit {
  user: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    // Hardcoded user with devices
    this.user = {
      id: id,
      nodeName: 'Hirono',
      userName: 'Hirono',
      email: 'hirono@example.com',
      phoneNumber: '(+63) 923 456 1234',
      address: 'Mandaue, Cebu',
      devices: [
        { id: 1, deviceName: 'Device 1', deviceStatus: 'Active', lastTimeActivated: '2025-08-20 14:30' },
        { id: 2, deviceName: 'Device 2', deviceStatus: 'Inactive', lastTimeActivated: '2025-08-19 16:00' }
      ]
    };
  }

  edituser(user: any): void {
    this.router.navigate(['/edit-user', user.id]);
  }

  editDevice(device: any): void {
    this.router.navigate(['/edit-device', device.id]);
  }

  deleteDevice(device: any): void {
    if (confirm(`Are you sure you want to delete ${device.name}?`)) {
      this.user.devices = this.user.devices.filter((d: any) => d.id !== device.id);
    }
  }
}
