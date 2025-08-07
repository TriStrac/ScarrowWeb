import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-singledevice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './singledevice.html',
  styleUrls: ['./singledevice.css']
})
export class SingledeviceComponent implements OnInit {
  deviceId: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.deviceId = this.route.snapshot.paramMap.get('id');
  }
}
