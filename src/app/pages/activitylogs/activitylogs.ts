import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupByDatePipe } from '../../utils/pipes/groupBydate.pipe';

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CommonModule, GroupByDatePipe],
  templateUrl: './activitylogs.html',
  styleUrls: ['./activitylogs.css']
})
export class ActivityLogsComponent {
  // ✅ Property renamed so template can access it
  activityLogs = [
    { user: 'Hirono', action: 'Added new device', date: '2025-08-19T08:00:00Z' },
    { user: 'Peach', action: 'Updated farmer profile', date: '2025-08-19T10:00:00Z' },
    { user: 'Nami', action: 'Deleted a report', date: '2025-08-18T12:00:00Z' },
    { user: 'Reynamie', action: 'Viewed activity logs', date: '2025-08-18T14:00:00Z' }
  ];
}
