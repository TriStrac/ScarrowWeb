import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ScarrowApiService, ApiDevice } from '../../../services/scarrow-api.service';

@Component({
  selector: 'app-device-linked-nodes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './device-linked-nodes.html',
  styleUrls: ['./device-linked-nodes.css'],
})
export class DeviceLinkedNodesComponent implements OnInit {
  central: ApiDevice | null = null;
  nodes: ApiDevice[] = [];
  farmerId: string | null = null;
  isLoading = true;
  loadError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ScarrowApiService,
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.farmerId = this.route.snapshot.queryParamMap.get('farmer');
    await this.loadNodes(id);
  }

  private async loadNodes(centralId: string): Promise<void> {
    this.isLoading = true;
    this.loadError = '';
    try {
      const devices = await firstValueFrom(this.api.getMyDevices());
      this.central = devices.find((d) => d.id === centralId) ?? null;
      this.nodes = devices.filter(
        (d) => (d.device_type ?? '').toUpperCase() === 'NODE',
      );
      if (!this.central) {
        this.loadError = 'Central device not found.';
      }
    } catch {
      this.loadError = 'Failed to load devices. Check your connection and try again.';
    } finally {
      this.isLoading = false;
    }
  }

  goBack(): void {
    if (this.farmerId) {
      void this.router.navigate(['/farmer', this.farmerId]);
      return;
    }
    void this.router.navigate(['/dashboard']);
  }
}
