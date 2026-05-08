import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { GroupByDatePipe } from '../../utils/pipes/groupBydate.pipe';
import { AuthService } from '../../services/auth.service';
import { ApiActivityLog, ScarrowApiService } from '../../services/scarrow-api.service';

type ActivityLogItem = { user: string; action: string; date: string };

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CommonModule, RouterLink, GroupByDatePipe],
  templateUrl: './activitylogs.html',
  styleUrls: ['./activitylogs.css'],
})
export class ActivityLogsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ScarrowApiService);

  readonly apiLogs = signal<ActivityLogItem[] | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal('');

  readonly farmerId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('farmerId') ?? '')),
    { initialValue: '' },
  );

  readonly memberName = signal('Member');

  readonly activityLogs = computed(() => this.apiLogs() ?? []);

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

  constructor() {
    void this.loadActivityLogs();
  }

  private async loadActivityLogs(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set('');
    try {
      const userId = this.farmerId();
      const gid = this.auth.groupId;

      let rows: ApiActivityLog[];
      if (userId && gid) {
        // HEAD viewing a member's logs  → GET /groups/:gid/members/:uid/activity-logs
        rows = await firstValueFrom(this.api.getMemberActivityLogs(gid, userId));
        // Attempt to get member display name from group roster
        try {
          const members = await firstValueFrom(this.api.getGroupMembers(gid));
          const member = members.find((m) => m.user_id === userId);
          if (member) this.memberName.set(member.display_name);
        } catch { /* ignore */ }
      } else {
        // User viewing their own logs  → GET /activityLogs/my
        rows = await firstValueFrom(this.api.getMyActivityLogs());
        this.memberName.set(this.auth.username ?? 'Me');
      }

      if (Array.isArray(rows) && rows.length > 0) {
        this.apiLogs.set(rows.map((r) => this.toActivityLogItem(r)));
      } else {
        this.apiLogs.set([]);
      }
    } catch {
      this.loadError.set('Could not load activity logs. Check your connection and try again.');
      this.apiLogs.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private toActivityLogItem(log: ApiActivityLog): ActivityLogItem {
    const when = log.created_at ?? log.timestamp ?? new Date().toISOString();
    return {
      user: log.actor_name ?? log.user ?? this.memberName(),
      action: log.action ?? log.message ?? 'Activity recorded',
      date: when,
    };
  }
}
