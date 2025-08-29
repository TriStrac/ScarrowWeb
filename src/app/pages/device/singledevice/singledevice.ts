import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-device',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './singledevice.html',
  styleUrls: ['./singledevice.css']
})
export class SingledeviceComponent {
  device = {
    nodeName: 'Node Device 1',
    deviceName: 'Device 1',
    location: 'Location 1',
    model: '9GAK45A0123',
    centralConnection: 'Central Device 1',
    status: 'ON',
    battery: 87,
    deviceId: '1274930484',
    version: 'Version 1.0',
    history: [
      { time: '1:23:45 PM', animal: 'Anvil 1', duration: '23 mins' },
      { time: '2:10:12 PM', animal: 'Bird', duration: '15 mins' },
      { time: '3:05:30 PM', animal: 'Rat', duration: '8 mins' }
    ]
  };

  editDevice(device: any) {
    console.log('Editing device:', device);
    // TODO: Navigate to edit form or open modal
  }
} 