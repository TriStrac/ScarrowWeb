import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-device',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './device.html',
  styleUrls: ['./device.css']
})
export class DeviceComponent {
  searchTerm: string = '';

  devices = [
    { id: 1, name: 'Device 1', status: 'Active', lastActivated: '2025-08-08 10:00 AM' },
    { id: 2, name: 'Device 2', status: 'Inactive', lastActivated: '2025-08-08 09:30 AM' },
    { id: 3, name: 'Device 3', status: 'Active', lastActivated: '2025-08-08 08:15 AM' }
  ];

  constructor(private router: Router) {}

  filteredDevices() {
    if (!this.searchTerm) return this.devices;
    const lower = this.searchTerm.toLowerCase();
    return this.devices.filter(d => d.name.toLowerCase().includes(lower));
  }

  goToDevice(id: number) {
    this.router.navigate(['/device', id]); // adjust route as per your app
  }

  editDevice(device: any) {
    console.log('Edit device:', device);
      // TODO: navigate to edit page or open modal
    }

  deleteDevice(device: any) {
    if (confirm(`Are you sure you want to delete ${device.name}?`)) {
      this.devices = this.devices.filter(d => d.id !== device.id);
    }
  }
}
