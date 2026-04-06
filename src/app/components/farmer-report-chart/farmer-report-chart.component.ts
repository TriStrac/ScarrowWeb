import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-farmer-report-chart',
  standalone: true,
  template: '<canvas #chartCanvas></canvas>',
  styles: `
    :host {
      display: block;
      width: 100%;
      min-height: 260px;
      position: relative;
    }
    canvas {
      width: 100% !important;
      height: 280px !important;
    }
  `,
})
export class FarmerReportChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input({ required: true }) labels!: string[];
  @Input({ required: true }) values!: number[];
  @Input() datasetLabel = 'Device';
  @Input() yAxisLabel = 'Triggered events';
  @Input() xAxisTitle = 'Months';

  private readonly platformId = inject(PLATFORM_ID);
  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.rebuildChart();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.canvasRef?.nativeElement) return;
    queueMicrotask(() => this.rebuildChart());
  }

  private rebuildChart(): void {
    const el = this.canvasRef?.nativeElement;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    this.chart?.destroy();
    this.chart = null;

    const labels = this.labels ?? [];
    const values = this.values ?? [];
    const maxV = Math.max(...values, 0, 1);
    const yMax = Math.max(4, Math.ceil(maxV * 1.2));

    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: this.datasetLabel,
            data: values,
            borderColor: '#2563eb',
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.25,
            pointBackgroundColor: '#2563eb',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'start',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16,
              font: { family: 'Inter, system-ui, sans-serif', size: 12 },
              color: '#475569',
            },
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            padding: 10,
            titleFont: { size: 12 },
            bodyFont: { size: 13 },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: this.xAxisTitle,
              color: '#64748b',
              font: { size: 11, weight: 600 },
            },
            grid: { color: 'rgba(148, 163, 184, 0.25)' },
            ticks: { color: '#64748b', font: { size: 11 }, maxRotation: 45, minRotation: 0 },
          },
          y: {
            min: 0,
            max: yMax,
            title: {
              display: true,
              text: this.yAxisLabel,
              color: '#64748b',
              font: { size: 11, weight: 600 },
            },
            grid: { color: 'rgba(148, 163, 184, 0.25)' },
            ticks: {
              color: '#64748b',
              font: { size: 11 },
              precision: 0,
            },
          },
        },
      },
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }
}
