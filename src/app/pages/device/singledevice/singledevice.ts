import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ModalComponent } from '../../../components/modal/modal.component';

@Component({
  selector: 'app-single-device',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './singledevice.html',
  styleUrls: ['./singledevice.css']
})
export class SingleDeviceComponent implements OnInit {
  device: any = null;
  isModalOpen = false;
  editableDevice: any = {};
  isDeviceOn = false;

  // Edit modes for individual fields
  editModes = {
    deviceName: false,
    owner: false,
    location: false,
    schedule: false
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Mock device data - replace with actual service call
    this.device = {
      nodeName: 'Device 1',
      deviceName: 'Device 1',
      status: 'ON',
      location: 'Location 1',
      battery: 75,
      model: 'Model X',
      deviceId: 'DEV001',
      centralConnection: 'Connected',
      version: 'v1.2.3',
      owner: 'Hirono',
      schedule: 'Schedule Device Active Time',
      history: [
        { time: '12/2/23 (12:02 PM)', animal: 'Bird', duration: '18 mins' },
        { time: '12/2/23 (12:02 PM)', animal: 'Rat', duration: '12 mins' },
        { time: '12/2/23 (12:02 PM)', animal: 'Bird', duration: '25 mins' },
        { time: '12/2/23 (12:02 PM)', animal: 'Cat', duration: '5 mins' }
      ]
    };
  }

  editDevice() {
    // Copy device data to editable object
    this.editableDevice = {
      deviceName: this.device.deviceName,
      owner: this.device.owner,
      location: this.device.location,
      schedule: this.device.schedule
    };

    // Set initial toggle state
    this.isDeviceOn = this.device.status === 'ON';

    // Reset edit modes
    this.editModes = {
      deviceName: false,
      owner: false,
      location: false,
      schedule: false
    };

    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  toggleEditMode(field: keyof typeof this.editModes) {
    if (this.editModes[field]) {
      // Save the field (you can add validation here)
      console.log(`Saved ${field}:`, this.editableDevice[field]);
    }
    this.editModes[field] = !this.editModes[field];
  }

  updateDeviceStatus() {
    // Handle status toggle
    console.log('Device status changed to:', this.isDeviceOn ? 'ON' : 'OFF');
  }

  saveDeviceChanges() {
    // Update the original device object
    this.device.deviceName = this.editableDevice.deviceName;
    this.device.owner = this.editableDevice.owner;
    this.device.location = this.editableDevice.location;
    this.device.schedule = this.editableDevice.schedule;
    this.device.status = this.isDeviceOn ? 'ON' : 'OFF';

    console.log('Device changes saved:', this.device);

    // Close modal
    this.closeModal();

    // Here you would typically call a service to save changes to backend
    // this.deviceService.updateDevice(this.device).subscribe(...)
  }
}
