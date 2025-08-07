import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-activitylog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activitylogs.html',
  styleUrls: ['./activitylogs.css']
})
export class ActivitylogComponent {
  // For search box binding (optional)
  searchQuery: string = '';

  // Dummy activity logs (you can replace this with real API call in future)
  activityLogs = [
    {
      userName: 'Hirono',
      userImage: 'https://i.imgur.com/O1t0GfZ.png',
      action: 'Added new device',
      timeAgo: '4 hours ago'
    },
    {
      userName: 'Namie',
      userImage: 'https://i.imgur.com/O1t0GfZ.png',
      action: 'Removed device',
      timeAgo: '6 hours ago'
    }
  ];
}
