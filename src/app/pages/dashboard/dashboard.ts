import { Component, HostListener, OnInit, inject } from '@angular/core';
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
  address: string;
  phone: string;
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

  members: MemberCard[] = [
    {
      id: '1',
      name: 'Juan Dela Cruz',
      farmName: 'Scarrow Demo Farm',
      address: '123 Rizal St., Brgy. San Jose, Cabanatuan City, Nueva Ecija',
      phone: '09171234567',
      deviceCount: 1,
      role: 'Farmer',
    },
    {
      id: '2',
      name: 'Maria Santos',
      farmName: 'Scarrow Demo Farm',
      address: 'Lot 4, Agri-Subd., Talavera, Nueva Ecija',
      phone: '+63 917 000 1122',
      deviceCount: 2,
      role: 'Farmer',
    },
    {
      id: '3',
      name: 'Pedro Ramos',
      farmName: 'Scarrow Demo Farm',
      address: 'Purok 2, Brgy. Sto. Niño, Cabanatuan City',
      phone: '+63 918 444 5566',
      deviceCount: 1,
      role: 'Farmer',
    },
  ];

  async ngOnInit(): Promise<void> {
    const gid = this.auth.groupId;
    const orgName = this.auth.groupName ?? 'Organization';
    if (!gid) return;
    try {
      const apiMembers = await firstValueFrom(this.api.getGroupMembers(gid));
      if (!apiMembers.length) return;
      this.members = apiMembers.map((m) => ({
        id: m.user_id,
        name: m.display_name,
        farmName: orgName,
        address: '—',
        phone: '—',
        deviceCount: 0,
        role: m.role === 'HEAD' ? 'Head' : m.role === 'MEMBER' ? 'Farmer' : m.role,
      }));
    } catch {
      /* keep demo roster */
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
