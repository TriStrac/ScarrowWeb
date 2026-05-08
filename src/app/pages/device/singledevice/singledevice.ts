import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ModalComponent } from '../../../components/modal/modal.component';
import {
  ScarrowApiService,
  ApiDevice,
  ApiDeviceLog,
} from '../../../services/scarrow-api.service';

interface DeviceView {
  historyKind: 'api' | 'not_found';
  nodeName: string;
  deviceName: string;
  status: string;
  location: string;
  battery: number;
  model: string;
  deviceId: string;
  deviceType: string;
  centralConnection: string;
  version: string;
  owner: string;
  schedule: string;
  apiLogs?: ApiDeviceLog[];
}

@Component({
  selector: 'app-single-device',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './singledevice.html',
  styleUrls: ['./singledevice.css'],
})
export class SingleDeviceComponent implements OnInit {
  device: DeviceView | null = null;
  isLoading = true;
  loadError = '';

  isModalOpen = false;
  editableDevice: any = {};
  isDeviceOn = false;

  editModes = {
    deviceName: false,
    owner: false,
    location: false,
    schedule: false,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ScarrowApiService,
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    await this.loadDevice(id);
  }

  private async loadDevice(id: string): Promise<void> {
    this.isLoading = true;
    this.loadError = '';
    try {
      const devices = await firstValueFrom(this.api.getMyDevices());
      const found = devices.find((d) => d.id === id);
      if (found) {
        const logs = await firstValueFrom(this.api.getDeviceLogs(id, 50, 0));
        this.device = this.mapApiDevice(found, logs);
      } else {
        this.loadError = 'Device not found.';
        this.device = null;
      }
    } catch {
      this.loadError = 'Failed to load device. Check your connection and try again.';
      this.device = null;
    } finally {
      this.isLoading = false;
    }
  }

  private mapApiDevice(device: ApiDevice, logs: ApiDeviceLog[]): DeviceView {
    const isOnline = (device.status ?? '').toUpperCase() === 'ONLINE';
    const deviceType = (device.device_type ?? '').toUpperCase() || 'N/A';
    const updatedAt = device.last_activated_at ?? device.updated_at;
    return {
      historyKind: 'api',
      nodeName: device.name ?? ((device.device_type ?? 'Device') + ' ' + device.id.slice(0, 6)),
      deviceName: device.name ?? ((device.device_type ?? 'Device') + ' ' + device.id.slice(0, 6)),
      status: isOnline ? 'ON' : 'OFF',
      location: 'N/A',
      battery: 0,
      model: device.device_type ?? 'N/A',
      deviceId: device.id,
      deviceType,
      centralConnection: isOnline ? 'Connected' : 'Disconnected',
      version: 'N/A',
      owner: 'N/A',
      schedule: updatedAt ? new Date(updatedAt).toLocaleString() : 'N/A',
      apiLogs: logs,
    };
  }

  formatLogTime(log: ApiDeviceLog): string {
    const ts = log.time_triggered ?? log.created_at;
    if (!ts) return 'N/A';
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  }

  goBack(): void {
    const farmer = this.route.snapshot.queryParamMap.get('farmer');
    if (farmer) {
      void this.router.navigate(['/farmer', farmer]);
      return;
    }
    void this.router.navigate(['/dashboard']);
  }

  editDevice(): void {
    if (!this.device) return;
    this.editableDevice = {
      deviceName: this.device.deviceName,
      owner: this.device.owner,
      location: this.device.location,
      schedule: this.device.schedule,
    };
    this.isDeviceOn = this.device.status === 'ON';
    this.editModes = { deviceName: false, owner: false, location: false, schedule: false };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  toggleEditMode(field: keyof typeof this.editModes): void {
    this.editModes[field] = !this.editModes[field];
  }

  updateDeviceStatus(): void {
  }

  saveDeviceChanges(): void {
    if (!this.device) return;
    this.device.deviceName = this.editableDevice.deviceName;
    this.device.owner = this.editableDevice.owner;
    this.device.location = this.editableDevice.location;
    this.device.schedule = this.editableDevice.schedule;
    this.device.status = this.isDeviceOn ? 'ON' : 'OFF';
    this.device.nodeName = this.editableDevice.deviceName;
    this.closeModal();
  }
}
