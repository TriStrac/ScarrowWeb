import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { GroupByDatePipe } from '../../utils/pipes/groupBydate.pipe';
import { PROFILE_BY_ID } from '../../data/farmer-profiles.data';
import { getFarmerActivityLogs } from '../../data/farmer-activity-logs.data';

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CommonModule, RouterLink, GroupByDatePipe],
  templateUrl: './activitylogs.html',
  styleUrls: ['./activitylogs.css'],
})
export class ActivityLogsComponent {
  private readonly route = inject(ActivatedRoute);

  readonly farmerId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('farmerId') ?? '')),
    { initialValue: '' },
  );

  readonly memberProfile = computed(() => {
    const id = this.farmerId();
    return id ? (PROFILE_BY_ID[id] ?? null) : null;
  });

  readonly memberName = computed(() => this.memberProfile()?.name ?? 'Member');

  readonly farmLabel = computed(() => this.memberProfile()?.farmName ?? null);

  readonly activityLogs = computed(() => getFarmerActivityLogs(this.farmerId(), this.memberName()));

  readonly searchQuery = signal('');

  readonly filteredLogs = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const logs = this.activityLogs();
    if (!q) return logs;
    return logs.filter((log) => {
      const d = new Date(log.date);
      const dateStr = d.toDateString().toLowerCase();
      const localeDate = d
        .toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        .toLowerCase();
      return (
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        dateStr.includes(q) ||
        localeDate.includes(q)
      );
    });
  });
}
