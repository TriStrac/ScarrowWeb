import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportComponent implements AfterViewInit {
  // Available options
  devices: string[] = [];
  locations: string[] = [];

  // Selected arrays for tags
  selectedDevices: string[] = [];
  selectedLocations: string[] = [];

  // Temporary selections for dropdowns
  tempSelectedDevice: string = '';
  tempSelectedLocation: string = '';

  // Other filters
  startDate: string = '';
  endDate: string = '';
  searchName: string = '';

  // Data properties
  mostPests: { name: string; count: number }[] = [];
  totalTriggered: number = 0;
  totalActive: number = 0;

  private chart: Chart | undefined;

  constructor(@Inject(PLATFORM_ID) private platformId: any) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadMockData();
      this.renderChart();
    }
  }

  // Device tag methods
  addDeviceTag(event: any): void {
    const selectedValue = event.target.value;
    if (selectedValue && !this.selectedDevices.includes(selectedValue)) {
      this.selectedDevices.push(selectedValue);
      this.tempSelectedDevice = ''; // Reset dropdown
      this.filterData();
    }
  }

  removeDeviceTag(device: string): void {
    this.selectedDevices = this.selectedDevices.filter(d => d !== device);
    this.filterData();
  }

  // Location tag methods
  addLocationTag(event: any): void {
    const selectedValue = event.target.value;
    if (selectedValue && !this.selectedLocations.includes(selectedValue)) {
      this.selectedLocations.push(selectedValue);
      this.tempSelectedLocation = ''; // Reset dropdown
      this.filterData();
    }
  }

  removeLocationTag(location: string): void {
    this.selectedLocations = this.selectedLocations.filter(l => l !== location);
    this.filterData();
  }

  // Date clearing methods
  clearStartDate(): void {
    this.startDate = '';
    this.filterData();
  }

  clearEndDate(): void {
    this.endDate = '';
    this.filterData();
  }

  // Filter method
  filterData(): void {
    console.log('Filters:', {
      devices: this.selectedDevices,
      locations: this.selectedLocations,
      start: this.startDate,
      end: this.endDate,
      search: this.searchName
    });

    // Here you would implement your actual filtering logic
    // For now, just logging the selected filters
  }

  private loadMockData(): void {
    // Available options
    this.devices = ['Device 1', 'Device 2', 'Device 3', 'Device 4'];
    this.locations = ['Location 1', 'Location 2', 'Location 3'];

    // Mock pest data
    this.mostPests = [
      { name: 'Bird 1', count: 0 },
      { name: 'Bird 4', count: 0 },
      { name: 'Rat 1', count: 0 }
    ];

    this.totalTriggered = 90;
    this.totalActive = 355;
  }

  private renderChart(): void {
    const canvas = document.getElementById('reportChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: ['100 min', '200 min', '300 min'],
        datasets: [
          {
            label: 'Device 1',
            data: [30, 90, 20],
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f6',
            fill: false,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Device 2',
            data: [20, 120, 40],
            borderColor: '#10b981',
            backgroundColor: '#10b981',
            fill: false,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Total Active (mins)',
              font: {
                size: 12
              }
            },
            grid: {
              display: true,
              color: '#e5e7eb'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Total Triggered Times',
              font: {
                size: 12
              }
            },
            grid: {
              display: true,
              color: '#e5e7eb'
            }
          }
        }
      }
    });
  }
}
