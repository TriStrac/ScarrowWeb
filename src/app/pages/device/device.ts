import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  ApiDevice,
  ScarrowApiService,
  ApiRegisterHubResponse,
  ApiRegisterNodeResponse,
} from '../../services/scarrow-api.service';
import { ModalComponent } from '../../components/modal/modal.component';

type DeviceRow = { id: string; name: string; type: string; status: string; lastActivated: string };
type RegisterStep = 'choose' | 'hub' | 'node' | 'success';

interface RegisterModal {
  isOpen: boolean;
  step: RegisterStep;
  isSaving: boolean;
  saveError: string;
  hubForm: { name: string; location_lat: string; location_lng: string };
  nodeForm: { hub_id: string; node_type: string; label: string };
  result: ApiRegisterHubResponse | ApiRegisterNodeResponse | null;
  resultKind: 'hub' | 'node' | null;
}

@Component({
  selector: 'app-device',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './device.html',
  styleUrls: ['./device.css'],
})
export class DeviceComponent implements OnInit {
  searchTerm = '';
  loadError = '';
  isLoading = true;

  devices: DeviceRow[] = [];
  availableHubs: { id: string; name: string }[] = [];

  reg: RegisterModal = {
    isOpen: false,
    step: 'choose',
    isSaving: false,
    saveError: '',
    hubForm: { name: '', location_lat: '', location_lng: '' },
    nodeForm: { hub_id: '', node_type: 'deterrence_v1', label: '' },
    result: null,
    resultKind: null,
  };

  constructor(
    private router: Router,
    private api: ScarrowApiService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadDevices();
  }

  async loadDevices(): Promise<void> {
    this.isLoading = true;
    this.loadError = '';
    try {
      const rows = await firstValueFrom(this.api.getMyDevices());
      this.devices = rows.map((d) => this.toDeviceRow(d));
      this.availableHubs = rows
        .filter((d) => (d.device_type ?? '').toUpperCase() === 'CENTRAL')
        .map((d) => ({
          id: d.id,
          name: d.name ?? ('Hub ' + d.id.slice(0, 6)),
        }));
    } catch {
      this.loadError = 'Failed to load devices. Check your connection and try again.';
      this.devices = [];
    } finally {
      this.isLoading = false;
    }
  }

  filteredDevices(): DeviceRow[] {
    if (!this.searchTerm) return this.devices;
    const lower = this.searchTerm.toLowerCase();
    return this.devices.filter(
      (d) => d.name.toLowerCase().includes(lower) || d.type.toLowerCase().includes(lower),
    );
  }

  goToDevice(id: string): void {
    void this.router.navigate(['/device', id]);
  }

  editDevice(device: DeviceRow): void {
    void this.router.navigate(['/device', device.id]);
  }

  deleteDevice(device: DeviceRow): void {
    if (confirm('Are you sure you want to remove "' + device.name + '" from this list?')) {
      this.devices = this.devices.filter((d) => d.id !== device.id);
    }
  }

  // Register Device modal
  openRegisterModal(): void {
    this.reg = {
      isOpen: true,
      step: 'choose',
      isSaving: false,
      saveError: '',
      hubForm: { name: '', location_lat: '', location_lng: '' },
      nodeForm: { hub_id: this.availableHubs[0]?.id ?? '', node_type: 'deterrence_v1', label: '' },
      result: null,
      resultKind: null,
    };
  }

  closeRegisterModal(): void {
    this.reg.isOpen = false;
  }

  selectRegisterType(type: 'hub' | 'node'): void {
    this.reg.step = type;
    this.reg.saveError = '';
  }

  backToChoose(): void {
    this.reg.step = 'choose';
    this.reg.saveError = '';
  }

  async submitRegister(): Promise<void> {
    this.reg.isSaving = true;
    this.reg.saveError = '';
    try {
      if (this.reg.step === 'hub') {
        const lat = parseFloat(this.reg.hubForm.location_lat);
        const lng = parseFloat(this.reg.hubForm.location_lng);
        if (!this.reg.hubForm.name.trim()) throw new Error('Hub name is required.');
        if (isNaN(lat) || isNaN(lng)) throw new Error('Latitude and longitude must be valid numbers.');
        const result = await firstValueFrom(
          this.api.registerHub({
            name: this.reg.hubForm.name.trim(),
            location_lat: lat,
            location_lng: lng,
          }),
        );
        this.reg.result = result;
        this.reg.resultKind = 'hub';
      } else if (this.reg.step === 'node') {
        if (!this.reg.nodeForm.hub_id) throw new Error('Please select a parent hub.');
        if (!this.reg.nodeForm.label.trim()) throw new Error('Node label is required.');
        const result = await firstValueFrom(
          this.api.registerNode({
            hub_id: this.reg.nodeForm.hub_id,
            node_type: this.reg.nodeForm.node_type,
            label: this.reg.nodeForm.label.trim(),
          }),
        );
        this.reg.result = result;
        this.reg.resultKind = 'node';
      }
      this.reg.step = 'success';
      await this.loadDevices();
    } catch (e: unknown) {
      const err = e as { message?: string; error?: { message?: string } };
      this.reg.saveError =
        err?.message ?? err?.error?.message ?? 'Registration failed. Please try again.';
    } finally {
      this.reg.isSaving = false;
    }
  }

  isHubResult(r: ApiRegisterHubResponse | ApiRegisterNodeResponse | null): r is ApiRegisterHubResponse {
    return r !== null && 'hub_id' in r;
  }

  isNodeResult(r: ApiRegisterHubResponse | ApiRegisterNodeResponse | null): r is ApiRegisterNodeResponse {
    return r !== null && 'node_id' in r;
  }

  private toDeviceRow(device: ApiDevice): DeviceRow {
    const status = (device.status ?? '').toUpperCase() === 'ONLINE' ? 'Active' : 'Inactive';
    const updatedAt = device.last_activated_at ?? device.updated_at;
    return {
      id: device.id,
      name: device.name ?? ((device.device_type ?? 'Device') + ' ' + device.id.slice(0, 6)),
      type: (device.device_type ?? 'N/A').toUpperCase(),
      status,
      lastActivated: updatedAt ? new Date(updatedAt).toLocaleString() : 'N/A',
    };
  }
}
