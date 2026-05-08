import { Component, ChangeDetectorRef, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { ScarrowApiService } from '../../services/scarrow-api.service';

export interface MemberCard {
  id: string;
  name: string;
  farmName: string;
  deviceCount: number;
  /** Display label for the role pill (e.g. Farmer). */
  role: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ScarrowApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Combined join + message counts for the bell. */
  readonly notifSummary = toSignal(this.notifications.summary$, {
    initialValue: { joinRequests: [], joinCount: 0, unreadMessages: 0, total: 0 },
  });

  readonly hasUnreadMessages = toSignal(this.notifications.hasUnreadMessages$, { initialValue: false });

  /** Panel for quick links; closes on outside click. */
  panelOpen = false;

  displayName = this.auth.username ?? 'Head Farmer';

  /** When set, the member quick-preview dialog is visible. */
  previewMember: MemberCard | null = null;

  isLoading = true;
  loadError = '';
  members: MemberCard[] = [];

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.loadError = '';
    const gid = this.auth.groupId;
    const orgName = this.auth.groupName ?? 'Organization';
    if (!gid) {
      this.loadError = 'No organization found in session. Please sign in again.';
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }
    try {
      const apiMembers = await firstValueFrom(this.api.getGroupMembers(gid));
      this.members = apiMembers
        .filter((m) => m.user_id !== this.auth.userId)
        .map((m) => ({
          id: m.user_id,
          name: m.display_name,
          farmName: orgName,
          deviceCount: 0,
          role: (m.role ?? '').toUpperCase() === 'HEAD' ? 'Head' : 'Farmer',
        }));
    } catch {
      this.loadError = 'Could not load members. Check your connection.';
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  memberInitial(name: string): string {
    const t = name.trim();
    return t ? t[0]!.toUpperCase() : '?';
  }

  openMemberPreview(m: MemberCard): void {
    this.previewMember = m;
  }

  closeMemberPreview(): void {
    this.previewMember = null;
  }

  viewMemberFull(): void {
    const m = this.previewMember;
    if (!m) return;
    this.closeMemberPreview();
    void this.router.navigate(['/farmer', m.id]);
  }

  toggleNotifyPanel(event: MouseEvent): void {
    event.stopPropagation();
    this.panelOpen = !this.panelOpen;
  }

  closeNotifyPanel(): void {
    this.panelOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.panelOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeClosePreview(): void {
    if (this.previewMember) {
      this.closeMemberPreview();
    }
  }

  goOrganizationRequests(event: Event): void {
    event.preventDefault();
    this.closeNotifyPanel();
    void this.router.navigate(['/organization'], { fragment: 'join-requests' });
  }

  goMessages(event: Event): void {
    event.preventDefault();
    this.closeNotifyPanel();
    void this.router.navigate(['/messages']);
  }
}
