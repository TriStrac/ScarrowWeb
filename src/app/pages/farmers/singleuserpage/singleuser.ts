import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  PROFILE_BY_ID,
  type FarmerDevice,
  type FarmerProfile,
} from '../../../data/farmer-profiles.data';
import { FarmerReportChartComponent } from '../../../components/farmer-report-chart/farmer-report-chart.component';

export type FarmerTab = 'devices' | 'reports' | 'activity';

export type { FarmerDevice, FarmerProfile };

export interface ActivityLogEntry {
  userName: string;
  action: string;
  when: string;
}

@Component({
  selector: 'app-singleuser',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FarmerReportChartComponent],
  templateUrl: './singleuser.html',
  styleUrls: ['./singleuser.css'],
})
export class SingleuserComponent implements OnInit {
  profile: FarmerProfile | null = null;
  activeTab: FarmerTab = 'devices';

  /** Central device whose linked-nodes preview is open (tap device card). */
  linkedNodesFor: FarmerDevice | null = null;

  /** Reports tab — demo data (replace with API). */
  reportDeviceSelect = '';
  selectedReportDevices: string[] = [];
  reportStats = { active: 2, error: 0, inactive: 1 };
  reportFromMonth = '2026-02';
  reportToMonth = '2026-04';
  reportChartLabels = ['Feb', 'Mar', 'Apr'];
  reportChartValues = [1152, 1219, 1486];
  reportTopDevices = ['Central Hub Alpha', 'Field Sensor North', 'Pump Monitor East'];
  reportTotalTriggered = 4272;
  reportTotalActiveMins = 14240;
  reportGranularity: 'monthly' | 'weekly' = 'monthly';

  /** Activity tab — demo data. */
  activityGroups: { label: string; entries: ActivityLogEntry[] }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.profile = PROFILE_BY_ID[id] ?? this.fallbackProfile(id);
    this.initReportFilters();
    this.initActivityDemo();
  }

  private initReportFilters(): void {
    const first = this.profile?.devices[0];
    this.reportDeviceSelect = first?.id ?? '';
    this.selectedReportDevices = first?.centralName ? [first.centralName] : ['Central Hub Alpha'];
  }

  private initActivityDemo(): void {
    const name = this.profile?.name ?? 'Member';
    this.activityGroups = [
      {
        label: 'Today',
        entries: [
          { userName: name, action: 'Opened app', when: '08:16 AM' },
          { userName: name, action: 'Viewed reports', when: '10:42 AM' },
        ],
      },
      {
        label: 'Yesterday',
        entries: [
          { userName: name, action: 'Updated profile', when: 'Yesterday 04:10 PM' },
          { userName: name, action: 'Viewed devices', when: 'Yesterday 11:28 AM' },
        ],
      },
    ];
  }

  get reportPeriodSummary(): string {
    const a = this.reportFromMonth.split('-');
    const b = this.reportToMonth.split('-');
    if (a.length < 2 || b.length < 2) return 'Monthly reports';
    const d1 = new Date(+a[0], +a[1] - 1, 1);
    const d2 = new Date(+b[0], +b[1] - 1, 1);
    const m1 = d1.toLocaleDateString('en-US', { month: 'short' });
    const m2 = d2.toLocaleDateString('en-US', { month: 'short' });
    const y1 = d1.getFullYear();
    const y2 = d2.getFullYear();
    if (y1 === y2) {
      return `Monthly reports for ${m1} – ${m2} ${y1}`;
    }
    return `Monthly reports for ${m1} ${y1} – ${m2} ${y2}`;
  }

  onReportDeviceSelectChange(): void {
    const d = this.profile?.devices.find((x) => x.id === this.reportDeviceSelect);
    if (!d) return;
    if (!this.selectedReportDevices.includes(d.centralName)) {
      this.selectedReportDevices = [...this.selectedReportDevices, d.centralName];
    }
  }

  removeReportDeviceChip(name: string): void {
    this.selectedReportDevices = this.selectedReportDevices.filter((n) => n !== name);
  }

  setReportGranularity(g: 'monthly' | 'weekly'): void {
    this.reportGranularity = g;
  }

  private fallbackProfile(id: string): FarmerProfile {
    return {
      id,
      name: 'Member',
      farmName: '—',
      role: 'Farmer',
      devices: [],
    };
  }

  get totalDevices(): number {
    return this.profile?.devices.length ?? 0;
  }

  get onlineCount(): number {
    return this.profile?.devices.filter((d) => d.online).length ?? 0;
  }

  get offlineCount(): number {
    return this.totalDevices - this.onlineCount;
  }

  setTab(tab: FarmerTab): void {
    this.activeTab = tab;
  }

  goBack(): void {
    void this.router.navigate(['/dashboard']);
  }

  openLinkedNodes(device: FarmerDevice): void {
    this.linkedNodesFor = device;
  }

  closeLinkedNodes(): void {
    this.linkedNodesFor = null;
  }

  viewAllLinkedNodes(): void {
    const d = this.linkedNodesFor;
    if (!d) return;
    const farmer = this.profile?.id;
    this.closeLinkedNodes();
    void this.router.navigate(['/device', d.id, 'nodes'], {
      queryParams: farmer ? { farmer } : {},
    });
  }

  @HostListener('document:keydown.escape')
  onEscapeCloseLinkedNodes(): void {
    if (this.linkedNodesFor) {
      this.closeLinkedNodes();
    }
  }

  editDevice(device: FarmerDevice, event?: Event): void {
    event?.stopPropagation();
    void this.router.navigate(['/device', device.id], {
      queryParams: this.profile?.id ? { farmer: this.profile.id } : {},
    });
  }

  deleteDevice(device: FarmerDevice, event?: Event): void {
    event?.stopPropagation();
    if (!this.profile) return;
    if (!confirm(`Remove this device from ${this.profile.name}'s list?`)) return;
    this.profile = {
      ...this.profile,
      devices: this.profile.devices.filter((d) => d.id !== device.id),
    };
  }
}
