import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- for ngModel
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportComponent implements OnInit {
  devices: string[] = [];
  locations: string[] = [];

  selectedDevice: string = '';
  selectedLocation: string = '';
  startDate: string = '';
  endDate: string = '';
  searchName: string = '';

  mostPests: { name: string; count: number }[] = [];
  totalTriggered: number = 0;
  totalActive: number = 0;

  private chart: any;

  constructor() {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    // 🔹 Mock data
    this.devices = ['Device 1', 'Device 2'];
    this.locations = ['Location 1', 'Location 2'];

    this.mostPests = [
      { name: 'Bird 1', count: 20 },
      { name: 'Bird 4', count: 15 },
      { name: 'Rat 1', count: 8 }
    ];

    this.totalTriggered = 90;
    this.totalActive = 355;

    // Initialize chart
    this.renderChart();
  }

  filterData(): void {
    console.log('Filters:', {
      device: this.selectedDevice,
      location: this.selectedLocation,
      start: this.startDate,
      end: this.endDate,
      search: this.searchName
    });
    // You can filter real data here later
  }

  renderChart(): void {
    const ctx = document.getElementById('reportChart') as HTMLCanvasElement;

    if (this.chart) {
      this.chart.destroy(); // Prevent duplicate charts
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['50 min', '100 min', '150 min', '200 min'],
        datasets: [
          {
            data: [30, 70, 90, 20],
            label: 'Device 1',
            borderColor: 'green',
            fill: false
          },
          {
            data: [20, 110, 130, 50],
            label: 'Device 2',
            borderColor: 'blue',
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }
        }
      }
    });
  }
}
