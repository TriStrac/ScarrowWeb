import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiDevice, ScarrowApiService } from '../../services/scarrow-api.service';

type DeviceRow = { id: string; name: string; status: string; lastActivated: string };

@Component({
  selector: 'app-device',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './device.html',
  styleUrls: ['./device.css']
})
export class DeviceComponent implements OnInit {
  searchTerm: string = '';
  loadError = '';

  devices: DeviceRow[] = [
    { id: '1', name: 'Device 1', status: 'Active', lastActivated: '2025-08-08 10:00 AM' },
    { id: '2', name: 'Device 2', status: 'Inactive', lastActivated: '2025-08-08 09:30 AM' },
    { id: '3', name: 'Device 3', status: 'Active', lastActivated: '2025-08-08 08:15 AM' }
  ];

  constructor(
    private router: Router,
    private api: ScarrowApiService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const rows = await firstValueFrom(this.api.getMyDevices());
      this.devices = rows.map((d) => this.toDeviceRow(d));
    } catch {
      this.loadError = 'Using local demo devices. Connect your account to load live devices.';
    }
  }

  filteredDevices() {
    if (!this.searchTerm) return this.devices;
    const lower = this.searchTerm.toLowerCase();
    return this.devices.filter(d => d.name.toLowerCase().includes(lower));
  }

  goToDevice(id: string) {
    this.router.navigate(['/device', id]); // adjust route as per your app
  }

  editDevice(device: DeviceRow) {
    console.log('Edit device:', device);
      // TODO: navigate to edit page or open modal
    }

  deleteDevice(device: DeviceRow) {
    if (confirm(`Are you sure you want to delete ${device.name}?`)) {
      this.devices = this.devices.filter(d => d.id !== device.id);
    }
  }

  private toDeviceRow(device: ApiDevice): DeviceRow {
    const status = (device.status ?? '').toUpperCase() === 'ONLINE' ? 'Active' : 'Inactive';
    const updatedAt = device.last_activated_at ?? device.updated_at;
    return {
      id: device.id,
      name: device.name ?? `${device.device_type ?? 'Device'} ${device.id.slice(0, 6)}`,
      status,
      lastActivated: updatedAt ? new Date(updatedAt).toLocaleString() : '—',
    };
  }
}
