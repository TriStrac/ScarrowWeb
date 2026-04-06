import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { findDeviceById, type FarmerDevice } from '../../../data/farmer-profiles.data';
import { getNodesForCentral, type ScarrowNodeDeviceMock } from '../../../data/scarrow-devices.data';

@Component({
  selector: 'app-device-linked-nodes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './device-linked-nodes.html',
  styleUrls: ['./device-linked-nodes.css'],
})
export class DeviceLinkedNodesComponent implements OnInit {
  central: FarmerDevice | null = null;
  nodes: ScarrowNodeDeviceMock[] = [];
  farmerId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.central = findDeviceById(id);
    this.nodes = getNodesForCentral(id);
    this.farmerId = this.route.snapshot.queryParamMap.get('farmer');
  }

  goBack(): void {
    if (this.farmerId) {
      void this.router.navigate(['/farmer', this.farmerId]);
      return;
    }
    void this.router.navigate(['/dashboard']);
  }
}
