import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalComponent } from '../../../components/modal/modal.component';
import { findDeviceById } from '../../../data/farmer-profiles.data';

@Component({
  selector: 'app-single-device',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './singledevice.html',
  styleUrls: ['./singledevice.css'],
})
export class SingleDeviceComponent implements OnInit {
  device: any = null;
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
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    const central = findDeviceById(id);
    const label = central?.centralName ?? (id ? `Device ${id}` : 'Device');

    this.device = {
      nodeName: label,
      deviceName: label,
      status: central ? (central.online ? 'ON' : 'OFF') : 'ON',
      location: central?.location ?? '—',
      battery: central ? (central.online ? 78 : 42) : 75,
      model: 'Model X',
      deviceId: id || 'DEV001',
      centralConnection: central ? (central.online ? 'Connected' : 'Disconnected') : 'Connected',
      version: 'v1.2.3',
      owner: 'Hirono',
      schedule: 'Schedule Device Active Time',
      history: [
        { time: '12/2/23 (12:02 PM)', animal: 'Bird', duration: '18 mins' },
        { time: '12/2/23 (12:02 PM)', animal: 'Rat', duration: '12 mins' },
        { time: '12/2/23 (12:02 PM)', animal: 'Bird', duration: '25 mins' },
        { time: '12/2/23 (12:02 PM)', animal: 'Cat', duration: '5 mins' },
      ],
    };
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
    this.editableDevice = {
      deviceName: this.device.deviceName,
      owner: this.device.owner,
      location: this.device.location,
      schedule: this.device.schedule,
    };

    this.isDeviceOn = this.device.status === 'ON';

    this.editModes = {
      deviceName: false,
      owner: false,
      location: false,
      schedule: false,
    };

    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  toggleEditMode(field: keyof typeof this.editModes): void {
    if (this.editModes[field]) {
      console.log(`Saved ${field}:`, this.editableDevice[field]);
    }
    this.editModes[field] = !this.editModes[field];
  }

  updateDeviceStatus(): void {
    console.log('Device status changed to:', this.isDeviceOn ? 'ON' : 'OFF');
  }

  saveDeviceChanges(): void {
    this.device.deviceName = this.editableDevice.deviceName;
    this.device.owner = this.editableDevice.owner;
    this.device.location = this.editableDevice.location;
    this.device.schedule = this.editableDevice.schedule;
    this.device.status = this.isDeviceOn ? 'ON' : 'OFF';
    this.device.nodeName = this.editableDevice.deviceName;

    this.closeModal();
  }
}
