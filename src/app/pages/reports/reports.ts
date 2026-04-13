import {
  Component,
  AfterViewInit,
  OnInit,
  Inject,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import {
  getAllReportPestEvents,
  type ReportPestEvent,
} from '../../data/scarrow-devices.data';
import { firstValueFrom } from 'rxjs';
import { ScarrowApiService } from '../../services/scarrow-api.service';

function localDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const CHART_PALETTE = ['#166534', '#0d9488', '#6366f1', '#c2410c', '#7c3aed'];

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css'],
})
export class ReportComponent implements OnInit, AfterViewInit {
  private readonly api = inject(ScarrowApiService);

  /** When set, chart + headline totals prefer `GET /reports/summary`. */
  liveFromApi = false;
  apiTimeframe = '';
  private apiDailyTrends: { count: number; date: string }[] = [];
  /** Central hubs that have paired node data. */
  hubOptions: { id: string; name: string }[] = [];
  selectedHubs: { id: string; name: string }[] = [];
  tempSelectedHub = '';

  /** Node device names (pests are recorded on nodes, not on the hub). */
  nodeNames: string[] = [];
  locations: string[] = [];

  selectedNodes: string[] = [];
  selectedLocations: string[] = [];

  tempSelectedNode = '';
  tempSelectedLocation = '';

  startDate = '';
  endDate = '';
  searchName = '';

  mostPests: { name: string; count: number }[] = [];
  totalTriggered = 0;
  /** Sum of deterrence duration in minutes (from node events). */
  totalActiveMins = 0;

  filteredEvents: ReportPestEvent[] = [];
  hasChartData = false;

  private allEvents: ReportPestEvent[] = [];
  private chart: Chart | undefined;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit(): void {
    void this.tryLoadApiSummary();
    this.allEvents = getAllReportPestEvents().sort(
      (a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt),
    );
    const hubMap = new Map<string, string>();
    for (const e of this.allEvents) {
      hubMap.set(e.centralId, e.centralName);
    }
    this.hubOptions = [...hubMap.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    this.nodeNames = [...new Set(this.allEvents.map((e) => e.nodeName))].sort();
    this.locations = [
      ...new Set(this.allEvents.map((e) => e.location)),
    ].sort();
    this.applyFilters();
  }

  private async tryLoadApiSummary(): Promise<void> {
    try {
      const s = await firstValueFrom(this.api.getReportsSummary('last_7_days'));
      const dist = s.pest_distribution ?? {};
      const entries = Object.entries(dist);
      if (entries.length || (s.daily_trends?.length ?? 0) > 0) {
        this.liveFromApi = true;
        this.apiTimeframe = s.timeframe ?? 'last_7_days';
        this.apiDailyTrends = s.daily_trends ?? [];
        this.mostPests = entries
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
        this.totalTriggered = s.overview?.total_alerts ?? entries.reduce((a, [, c]) => a + c, 0);
        this.totalActiveMins = 0;
        if (isPlatformBrowser(this.platformId)) {
          this.renderChart();
        }
      }
    } catch {
      /* demo data only */
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.renderChart();
    }
  }

  addHubTag(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    if (!id) return;
    const hub = this.hubOptions.find((h) => h.id === id);
    if (!hub || this.selectedHubs.some((h) => h.id === hub.id)) return;
    this.selectedHubs = [...this.selectedHubs, hub];
    this.tempSelectedHub = '';
    this.filterData();
  }

  removeHubTag(id: string): void {
    this.selectedHubs = this.selectedHubs.filter((h) => h.id !== id);
    this.filterData();
  }

  addNodeTag(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    if (selectedValue && !this.selectedNodes.includes(selectedValue)) {
      this.selectedNodes.push(selectedValue);
      this.tempSelectedNode = '';
      this.filterData();
    }
  }

  removeNodeTag(node: string): void {
    this.selectedNodes = this.selectedNodes.filter((n) => n !== node);
    this.filterData();
  }

  addLocationTag(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    if (selectedValue && !this.selectedLocations.includes(selectedValue)) {
      this.selectedLocations.push(selectedValue);
      this.tempSelectedLocation = '';
      this.filterData();
    }
  }

  removeLocationTag(location: string): void {
    this.selectedLocations = this.selectedLocations.filter((l) => l !== location);
    this.filterData();
  }

  clearStartDate(): void {
    this.startDate = '';
    this.filterData();
  }

  clearEndDate(): void {
    this.endDate = '';
    this.filterData();
  }

  clearDateRange(): void {
    this.startDate = '';
    this.endDate = '';
    this.filterData();
  }

  filterData(): void {
    this.applyFilters();
    if (isPlatformBrowser(this.platformId)) {
      this.renderChart();
    }
  }

  private applyFilters(): void {
    const q = this.searchName.trim().toLowerCase();
    const allowedHubIds =
      this.selectedHubs.length > 0 ? new Set(this.selectedHubs.map((h) => h.id)) : null;

    let rows = this.allEvents.filter((e) => {
      if (allowedHubIds && !allowedHubIds.has(e.centralId)) {
        return false;
      }
      if (this.selectedNodes.length && !this.selectedNodes.includes(e.nodeName)) {
        return false;
      }
      if (this.selectedLocations.length && !this.selectedLocations.includes(e.location)) {
        return false;
      }
      const day = localDateKey(e.occurredAt);
      if (!day) return false;
      if (this.startDate && day < this.startDate) return false;
      if (this.endDate && day > this.endDate) return false;
      if (q) {
        const hay =
          `${e.nodeName} ${e.location} ${e.farmerName} ${e.centralName} ${e.centralId}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    this.filteredEvents = rows;

    const pestMap = new Map<string, number>();
    for (const e of rows) {
      pestMap.set(e.pestClass, (pestMap.get(e.pestClass) ?? 0) + 1);
    }
    this.mostPests = [...pestMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    this.totalTriggered = rows.length;
    this.totalActiveMins = rows.reduce((s, e) => s + e.durationSeconds / 60, 0);
  }

  private renderChart(): void {
    const canvas = document.getElementById('reportChart') as HTMLCanvasElement | null;
    if (!canvas) return;

    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }

    if (this.liveFromApi && this.apiDailyTrends.length > 0) {
      const labels = this.apiDailyTrends.map((d) => d.date);
      const data = this.apiDailyTrends.map((d) => d.count);
      this.hasChartData = data.some((n) => n > 0);
      if (!labels.length) return;
      const colors = labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]);
      this.chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Alerts per day',
              data,
              backgroundColor: colors.map((c) => `${c}cc`),
              borderColor: colors,
              borderWidth: 1.5,
              borderRadius: 8,
              maxBarThickness: 48,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 }, maxRotation: 35, minRotation: 0 },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Count',
                font: { size: 12, weight: 500 },
              },
              ticks: { stepSize: 1 },
              grid: { color: '#f1f5f9' },
            },
          },
        },
      });
      return;
    }

    const byDevice = new Map<string, number>();
    for (const e of this.filteredEvents) {
      byDevice.set(e.nodeName, (byDevice.get(e.nodeName) ?? 0) + 1);
    }

    const labels = [...byDevice.keys()].sort();
    const data = labels.map((k) => byDevice.get(k) ?? 0);
    this.hasChartData = labels.length > 0 && data.some((n) => n > 0);

    if (!labels.length) {
      return;
    }

    const colors = labels.map(
      (_, i) => CHART_PALETTE[i % CHART_PALETTE.length],
    );

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Triggered events',
            data,
            backgroundColor: colors.map((c) => `${c}cc`),
            borderColor: colors,
            borderWidth: 1.5,
            borderRadius: 8,
            maxBarThickness: 48,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const i = ctx.dataIndex;
                const name = labels[i];
                const evts = this.filteredEvents.filter((e) => e.nodeName === name);
                if (!evts.length) return '';
                const avgHz = Math.round(
                  evts.reduce((s, e) => s + e.frequencyHz, 0) / evts.length,
                );
                return `Avg frequency: ${avgHz} Hz`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, maxRotation: 35, minRotation: 0 },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Triggered events',
              font: { size: 12, weight: 500 },
            },
            ticks: { stepSize: 1 },
            grid: { color: '#f1f5f9' },
          },
        },
      },
    });
  }
}
