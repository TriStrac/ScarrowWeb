import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import {
  ScarrowApiService,
  ApiDevice,
  ApiActivityLog,
  ApiHubReport,
} from '../../../services/scarrow-api.service';
import { FarmerReportChartComponent } from '../../../components/farmer-report-chart/farmer-report-chart.component';

export type FarmerTab = 'devices' | 'reports' | 'activity';

interface ActivityGroup {
  label: string;
  entries: ActivityLogEntry[];
}

interface ActivityLogEntry {
  actor: string;
  action: string;
  when: string;
}

@Component({
  selector: 'app-singleuser',
  standalone: true,
  imports: [CommonModule, FormsModule, FarmerReportChartComponent],
  templateUrl: './singleuser.html',
  styleUrls: ['./singleuser.css'],
})
export class SingleuserComponent implements OnInit {
  isLoading = true;
  loadError = '';

  // Member info
  userId = '';
  displayName = '';
  role = '';

  // Devices tab
  devices: ApiDevice[] = [];
  devicesLoading = false;
  devicesError = '';

  // Linked-nodes drawer
  linkedNodesFor: ApiDevice | null = null;

  // Activity tab
  activityGroups: ActivityGroup[] = [];
  activityLoading = false;
  activityError = '';

  // Reports tab
  activeTab: FarmerTab = 'devices';
  reportLoading = false;
  reportError = '';
  reportHubId = '';
  reportFromMonth = '';
  reportToMonth = '';
  reportChartLabels: string[] = [];
  reportChartValues: number[] = [];
  reportChartDatasetLabel = '';
  reportChartXTitle = 'Days';
  reportTotalEvents = 0;
  reportPestDist: { pest: string; count: number }[] = [];
  reportGranularity: 'daily' | 'monthly' = 'daily';
  availableHubs: ApiDevice[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private api: ScarrowApiService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.userId = this.route.snapshot.paramMap.get('id') ?? '';
    await this.loadMemberData();
  }

  private async loadMemberData(): Promise<void> {
    this.isLoading = true;
    this.loadError = '';
    const gid = this.auth.groupId;
    if (!gid) {
      this.loadError = 'Group session not found. Please sign in again.';
      this.isLoading = false;
      return;
    }
    try {
      const members = await firstValueFrom(this.api.getGroupMembers(gid));
      const member = members.find((m) => m.user_id === this.userId);
      if (!member) {
        this.loadError = 'Member not found.';
        this.isLoading = false;
        return;
      }
      this.displayName = member.display_name;
      this.role = member.role;
      await this.loadDevices(gid);
    } catch {
      this.loadError = 'Failed to load member data. Check your connection.';
    } finally {
      this.isLoading = false;
    }
  }

  private async loadDevices(gid: string): Promise<void> {
    this.devicesLoading = true;
    this.devicesError = '';
    try {
      this.devices = await firstValueFrom(this.api.getMemberDevices(gid, this.userId));
      this.availableHubs = this.devices.filter(
        (d) => (d.device_type ?? '').toUpperCase() === 'CENTRAL',
      );
      if (this.availableHubs.length) {
        this.reportHubId = this.availableHubs[0].id;
      }
    } catch {
      this.devicesError = 'Could not load devices for this member.';
    } finally {
      this.devicesLoading = false;
    }
  }

  private async loadActivity(): Promise<void> {
    const gid = this.auth.groupId;
    if (!gid) return;
    this.activityLoading = true;
    this.activityError = '';
    try {
      const logs = await firstValueFrom(this.api.getMemberActivityLogs(gid, this.userId));
      this.activityGroups = this.groupLogs(logs);
    } catch {
      this.activityError = 'Could not load activity logs for this member.';
    } finally {
      this.activityLoading = false;
    }
  }

  private groupLogs(logs: ApiActivityLog[]): ActivityGroup[] {
    const groups = new Map<string, ActivityLogEntry[]>();
    const today = new Date();
    for (const log of logs) {
      const ts = log.created_at ?? log.timestamp ?? '';
      let label = 'Older';
      if (ts) {
        const d = new Date(ts);
        const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
        if (diff === 0) label = 'Today';
        else if (diff === 1) label = 'Yesterday';
        else if (diff < 7) label = 'This week';
        else if (diff < 30) label = 'This month';
      }
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push({
        actor: log.actor_name ?? log.user ?? this.displayName,
        action: log.action ?? log.message ?? 'Activity recorded',
        when: ts ? new Date(ts).toLocaleString() : 'Unknown time',
      });
    }
    const order = ['Today', 'Yesterday', 'This week', 'This month', 'Older'];
    const result: ActivityGroup[] = [];
    for (const label of order) {
      const entries = groups.get(label);
      if (entries?.length) result.push({ label, entries });
    }
    return result;
  }

  async loadHubReport(): Promise<void> {
    if (!this.reportHubId) { this.reportError = 'No hub selected.'; return; }
    this.reportLoading = true;
    this.reportError = '';
    try {
      const startDate = this.reportFromMonth ? this.reportFromMonth + '-01' : undefined;
      const endDate = this.reportToMonth
        ? this.reportToMonth + '-' + new Date(
            +this.reportToMonth.split('-')[0],
            +this.reportToMonth.split('-')[1],
            0,
          ).getDate()
        : undefined;
      const report = await firstValueFrom(this.api.getHubReport(this.reportHubId, startDate, endDate));
      this.applyReport(report);
    } catch {
      this.reportError = 'Could not load report. Try again.';
    } finally {
      this.reportLoading = false;
    }
  }

  private applyReport(report: ApiHubReport): void {
    this.reportTotalEvents = report.total_events ?? 0;
    const dist = report.pest_distribution ?? {};
    this.reportPestDist = Object.entries(dist)
      .map(([pest, count]) => ({ pest, count }))
      .sort((a, b) => b.count - a.count);
    const hub = this.availableHubs.find((h) => h.id === this.reportHubId);
    this.reportChartDatasetLabel = hub?.name ?? 'Hub report';

    const trends = report.daily_trends ?? [];
    if (trends.length) {
      this.reportChartLabels = trends.map((t) => t.date);
      this.reportChartValues = trends.map((t) => t.count);
      this.reportChartXTitle = 'Days';
    } else {
      this.reportChartLabels = [];
      this.reportChartValues = [];
    }
  }

  setTab(tab: FarmerTab): void {
    this.activeTab = tab;
    if (tab === 'activity' && !this.activityGroups.length && !this.activityLoading) {
      void this.loadActivity();
    }
    if (tab === 'reports' && this.reportHubId && !this.reportChartLabels.length && !this.reportLoading) {
      void this.loadHubReport();
    }
  }

  get totalDevices(): number { return this.devices.length; }

  get onlineCount(): number {
    return this.devices.filter((d) => (d.status ?? '').toUpperCase() === 'ONLINE').length;
  }

  get offlineCount(): number { return this.totalDevices - this.onlineCount; }

  get nodeCount(): number {
    return this.devices.filter((d) => !this.isCentral(d)).length;
  }

  isOnline(d: ApiDevice): boolean {
    return (d.status ?? '').toUpperCase() === 'ONLINE';
  }

  isCentral(d: ApiDevice): boolean {
    return (d.device_type ?? '').toUpperCase() === 'CENTRAL';
  }

  deviceDisplayName(d: ApiDevice): string {
    return d.name ?? ((d.device_type ?? 'Device') + ' ' + d.id.slice(0, 6));
  }

  goBack(): void {
    void this.router.navigate(['/dashboard']);
  }

  openLinkedNodes(device: ApiDevice): void {
    if (this.isCentral(device)) {
      this.linkedNodesFor = device;
    }
  }

  closeLinkedNodes(): void { this.linkedNodesFor = null; }

  viewAllLinkedNodes(): void {
    const d = this.linkedNodesFor;
    if (!d) return;
    this.closeLinkedNodes();
    void this.router.navigate(['/device', d.id, 'nodes'], {
      queryParams: { farmer: this.userId },
    });
  }

  @HostListener('document:keydown.escape')
  onEscapeCloseLinkedNodes(): void {
    if (this.linkedNodesFor) this.closeLinkedNodes();
  }

  editDevice(device: ApiDevice, event?: Event): void {
    event?.stopPropagation();
    void this.router.navigate(['/device', device.id], {
      queryParams: { farmer: this.userId },
    });
  }

  onReportMonthChange(): void {
    if (this.reportFromMonth && this.reportToMonth && this.reportFromMonth > this.reportToMonth) {
      [this.reportFromMonth, this.reportToMonth] = [this.reportToMonth, this.reportFromMonth];
    }
    if (this.reportHubId) void this.loadHubReport();
  }

  onHubChange(): void {
    if (this.reportHubId) void this.loadHubReport();
  }
}
