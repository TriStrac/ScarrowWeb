import {
  Component,
  AfterViewInit,
  OnInit,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { firstValueFrom } from 'rxjs';
import { ScarrowApiService, ApiDevice, ApiHubReport } from '../../services/scarrow-api.service';

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
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = true;
  loadError = '';
  reportLoading = false;
  reportError = '';

  /** Available hubs for the selector. */
  hubOptions: ApiDevice[] = [];
  selectedHubId = '';

  startDate = '';
  endDate = '';

  totalTriggered = 0;
  pestDist: { name: string; count: number }[] = [];
  dailyTrends: { date: string; count: number }[] = [];
  hasChartData = false;

  private chart: Chart | undefined;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  async ngOnInit(): Promise<void> {
    await this.loadHubs();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId) && this.dailyTrends.length) {
      this.renderChart();
    }
  }

  private async loadHubs(): Promise<void> {
    this.isLoading = true;
    this.loadError = '';
    try {
      const devices = await firstValueFrom(this.api.getMyDevices());
      this.hubOptions = devices.filter(
        (d) => (d.device_type ?? '').toUpperCase() === 'CENTRAL',
      );
      if (this.hubOptions.length) {
        this.selectedHubId = this.hubOptions[0].id;
        await this.loadReport();
      }
    } catch {
      this.loadError = 'Could not load your hubs. Check your connection.';
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  async loadReport(): Promise<void> {
    if (!this.selectedHubId) { this.reportError = 'No hub selected.'; return; }
    this.reportLoading = true;
    this.reportError = '';
    try {
      const startDate = this.startDate || undefined;
      const endDate = this.endDate || undefined;
      const report: ApiHubReport = await firstValueFrom(
        this.api.getHubReport(this.selectedHubId, startDate, endDate),
      );
      this.applyReport(report);
    } catch {
      this.reportError = 'Could not load report. Try again.';
    } finally {
      this.reportLoading = false;
      this.cdr.markForCheck();
      if (isPlatformBrowser(this.platformId)) {
        setTimeout(() => this.renderChart());
      }
    }
  }

  private applyReport(report: ApiHubReport): void {
    this.totalTriggered = report.total_events ?? 0;
    const dist = report.pest_distribution ?? {};
    this.pestDist = Object.entries(dist)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    this.dailyTrends = report.daily_trends ?? [];
    this.hasChartData = this.dailyTrends.some((t) => t.count > 0);
  }

  onHubChange(): void {
    void this.loadReport();
  }

  onDateChange(): void {
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      [this.startDate, this.endDate] = [this.endDate, this.startDate];
    }
    void this.loadReport();
  }

  clearDateRange(): void {
    this.startDate = '';
    this.endDate = '';
    void this.loadReport();
  }

  hubDisplayName(d: ApiDevice): string {
    return d.name ?? ('Hub ' + d.id.slice(0, 6));
  }

  private renderChart(): void {
    const canvas = document.getElementById('reportChart') as HTMLCanvasElement | null;
    if (!canvas) return;
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
    if (!this.dailyTrends.length) return;

    const labels = this.dailyTrends.map((d) => d.date);
    const data = this.dailyTrends.map((d) => d.count);
    const colors = labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]);

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Deterrence events',
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
              text: 'Events',
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
