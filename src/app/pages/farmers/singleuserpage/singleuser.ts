import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  PROFILE_BY_ID,
  type FarmerDevice,
  type FarmerProfile,
} from '../../../data/farmer-profiles.data';
import {
  getFarmerActivityLogs,
  groupActivityLogsForFarmerTab,
} from '../../../data/farmer-activity-logs.data';
import {
  getReportPestEventsForFarmer,
  type ReportPestEvent,
} from '../../../data/scarrow-devices.data';
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

  /** Reports tab — driven by node pest events + device filters. */
  reportDeviceSelect = '';
  selectedReportDevices: string[] = [];
  reportStats = { active: 0, error: 0, inactive: 0 };
  reportFromMonth = '2026-04';
  reportToMonth = '2026-04';
  reportChartLabels: string[] = [];
  reportChartValues: number[] = [];
  reportChartDatasetLabel = 'All hubs';
  reportChartXTitle = 'Months';
  reportTopDevices: string[] = [];
  reportTotalTriggered = 0;
  reportTotalActiveMins = 0;
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
    this.refreshReportDashboard();
    this.initActivityFromSharedData();
  }

  private initReportFilters(): void {
    const first = this.profile?.devices[0];
    this.reportDeviceSelect = first?.id ?? '';
    this.selectedReportDevices = first?.centralName ? [first.centralName] : [];

    const farmerId = this.profile?.id ?? '';
    const evts = farmerId ? getReportPestEventsForFarmer(farmerId) : [];
    if (evts.length) {
      const yms = evts.map((e) => e.occurredAt.slice(0, 7));
      this.reportFromMonth = yms.reduce((a, b) => (a < b ? a : b));
      this.reportToMonth = yms.reduce((a, b) => (a > b ? a : b));
    } else {
      this.reportFromMonth = '2026-02';
      this.reportToMonth = '2026-04';
    }
  }

  private initActivityFromSharedData(): void {
    const id = this.profile?.id ?? '';
    const name = this.profile?.name ?? 'Member';
    const logs = getFarmerActivityLogs(id, name);
    this.activityGroups = groupActivityLogsForFarmerTab(logs);
  }

  get reportPeriodSummary(): string {
    const a = this.reportFromMonth.split('-');
    const b = this.reportToMonth.split('-');
    if (a.length < 2 || b.length < 2) return 'Node deterrence reports';
    const d1 = new Date(+a[0], +a[1] - 1, 1);
    const d2 = new Date(+b[0], +b[1] - 1, 1);
    const m1 = d1.toLocaleDateString('en-US', { month: 'short' });
    const m2 = d2.toLocaleDateString('en-US', { month: 'short' });
    const y1 = d1.getFullYear();
    const y2 = d2.getFullYear();
    const kind =
      this.reportGranularity === 'weekly' ? 'Weekly reports' : 'Monthly reports';
    if (y1 === y2) {
      return `${kind} for ${m1} – ${m2} ${y1} (node devices)`;
    }
    return `${kind} for ${m1} ${y1} – ${m2} ${y2} (node devices)`;
  }

  onReportDeviceSelectChange(): void {
    const d = this.profile?.devices.find((x) => x.id === this.reportDeviceSelect);
    if (!d) return;
    if (!this.selectedReportDevices.includes(d.centralName)) {
      this.selectedReportDevices = [...this.selectedReportDevices, d.centralName];
    }
    this.refreshReportDashboard();
  }

  removeReportDeviceChip(name: string): void {
    this.selectedReportDevices = this.selectedReportDevices.filter((n) => n !== name);
    this.refreshReportDashboard();
  }

  onReportMonthChange(): void {
    if (this.reportFromMonth && this.reportToMonth && this.reportFromMonth > this.reportToMonth) {
      const t = this.reportFromMonth;
      this.reportFromMonth = this.reportToMonth;
      this.reportToMonth = t;
    }
    this.refreshReportDashboard();
  }

  setReportGranularity(g: 'monthly' | 'weekly'): void {
    this.reportGranularity = g;
    this.refreshReportDashboard();
  }

  private ymToMonthStart(ym: string): Date {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1, 0, 0, 0, 0);
  }

  private ymToMonthEnd(ym: string): Date {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m, 0, 23, 59, 59, 999);
  }

  private eachYmInclusive(fromYm: string, toYm: string): string[] {
    let a = fromYm;
    let b = toYm;
    if (a > b) {
      const t = a;
      a = b;
      b = t;
    }
    const out: string[] = [];
    const [y0, m0] = a.split('-').map(Number);
    const [y1, m1] = b.split('-').map(Number);
    let y = y0;
    let m = m0;
    while (y < y1 || (y === y1 && m <= m1)) {
      out.push(`${y}-${String(m).padStart(2, '0')}`);
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    return out;
  }

  private formatYmLabel(ym: string, allYms: string[]): string {
    const [y, mo] = ym.split('-').map(Number);
    const d = new Date(y, mo - 1, 1);
    const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
    const years = new Set(allYms.map((x) => x.slice(0, 4)));
    if (years.size > 1) {
      return `${monthShort} ${y}`;
    }
    return monthShort;
  }

  private buildWeeklySeries(
    events: ReportPestEvent[],
    fromYm: string,
    toYm: string,
  ): { labels: string[]; values: number[] } {
    let a = fromYm;
    let b = toYm;
    if (a > b) {
      const t = a;
      a = b;
      b = t;
    }
    const rangeStart = this.ymToMonthStart(a);
    const rangeEnd = this.ymToMonthEnd(b);
    const labels: string[] = [];
    const values: number[] = [];
    let wkStart = new Date(rangeStart);
    let guard = 0;
    while (wkStart <= rangeEnd && guard++ < 52) {
      const wkEnd = new Date(wkStart);
      wkEnd.setDate(wkEnd.getDate() + 6);
      wkEnd.setHours(23, 59, 59, 999);
      const sliceEnd = wkEnd > rangeEnd ? rangeEnd : wkEnd;
      const count = events.filter((e) => {
        const t = new Date(e.occurredAt).getTime();
        return t >= wkStart.getTime() && t <= sliceEnd.getTime();
      }).length;
      labels.push(
        wkStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      );
      values.push(count);
      wkStart = new Date(sliceEnd);
      wkStart.setDate(wkStart.getDate() + 1);
      wkStart.setHours(0, 0, 0, 0);
    }
    return { labels, values };
  }

  private refreshReportDashboard(): void {
    if (!this.profile) return;

    this.reportStats = {
      active: this.profile.devices.filter((d) => d.online && d.status === 'Active').length,
      inactive: this.profile.devices.filter((d) => !d.online || d.status === 'Inactive').length,
      error: 0,
    };

    const allFarmer = getReportPestEventsForFarmer(this.profile.id);
    /** Hub ids: pest metrics come only from **nodes paired** to these centrals. */
    const allowedCentralIds =
      this.selectedReportDevices.length > 0
        ? this.profile.devices
            .filter((d) => this.selectedReportDevices.includes(d.centralName))
            .map((d) => d.id)
        : this.profile.devices.map((d) => d.id);

    let fromYm = this.reportFromMonth;
    let toYm = this.reportToMonth;
    if (fromYm && toYm && fromYm > toYm) {
      const t = fromYm;
      fromYm = toYm;
      toYm = t;
    }

    const rangeStart = this.ymToMonthStart(fromYm);
    const rangeEnd = this.ymToMonthEnd(toYm);

    let events = allFarmer.filter((e) => allowedCentralIds.includes(e.centralId));
    events = events.filter((e) => {
      const t = new Date(e.occurredAt).getTime();
      return t >= rangeStart.getTime() && t <= rangeEnd.getTime();
    });

    this.reportTotalTriggered = events.length;
    this.reportTotalActiveMins = Math.round(
      events.reduce((s, e) => s + e.durationSeconds / 60, 0),
    );

    const byNode = new Map<string, number>();
    for (const e of events) {
      byNode.set(e.nodeName, (byNode.get(e.nodeName) ?? 0) + 1);
    }
    this.reportTopDevices = [...byNode.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const chipLabel =
      this.selectedReportDevices.length > 0
        ? this.selectedReportDevices.join(', ')
        : 'All hubs';
    this.reportChartDatasetLabel =
      chipLabel.length > 42 ? `${chipLabel.slice(0, 39)}…` : chipLabel;

    if (this.reportGranularity === 'weekly') {
      const w = this.buildWeeklySeries(events, fromYm, toYm);
      this.reportChartLabels = w.labels;
      this.reportChartValues = w.values;
      this.reportChartXTitle = 'Week starting';
    } else {
      const months = this.eachYmInclusive(fromYm, toYm);
      this.reportChartLabels = months.map((ym) => this.formatYmLabel(ym, months));
      const counts = new Map<string, number>();
      for (const ym of months) {
        counts.set(ym, 0);
      }
      for (const e of events) {
        const k = e.occurredAt.slice(0, 7);
        if (counts.has(k)) {
          counts.set(k, (counts.get(k) ?? 0) + 1);
        }
      }
      this.reportChartValues = months.map((ym) => counts.get(ym) ?? 0);
      this.reportChartXTitle = 'Months';
    }
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
    if (tab === 'reports') {
      this.refreshReportDashboard();
    }
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
    this.refreshReportDashboard();
  }
}
