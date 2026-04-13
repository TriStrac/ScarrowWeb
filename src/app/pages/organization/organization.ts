import { Component, HostListener, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { NotificationService, JoinRequest } from '../../services/notification.service';
import { OrgMember } from '../../data/demo-org-members';
import { AuthService } from '../../services/auth.service';
import { ScarrowApiService } from '../../services/scarrow-api.service';

export type { OrgMember } from '../../data/demo-org-members';

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './organization.html',
  styleUrls: ['./organization.css'],
})
export class OrganizationComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ScarrowApiService);

  /** Pending users who asked to join (shown to org admins). */
  readonly joinRequests = toSignal(this.notifications.joinRequests, { initialValue: [] as JoinRequest[] });

  organizationName = 'Scarrow Demo Farm';

  currentUserId = '';

  isOrgAdmin = false;

  members: OrgMember[] = [];

  selectedMember: OrgMember | null = null;

  loadError = '';

  lastInviteCode: string | null = null;

  async ngOnInit(): Promise<void> {
    this.currentUserId = this.auth.userId ?? '';
    this.isOrgAdmin = (this.auth.role ?? '').toUpperCase() === 'HEAD';
    if (this.auth.groupName) {
      this.organizationName = this.auth.groupName;
    }
    const gid = this.auth.groupId;
    if (!gid) {
      this.loadError = 'No organization in session. Sign in again after your account is assigned to a group.';
      return;
    }
    try {
      const details = await firstValueFrom(this.api.getGroup(gid));
      this.organizationName = details.name ?? this.organizationName;
    } catch {
      /* use session name */
    }
    try {
      const rows = await firstValueFrom(this.api.getGroupMembers(gid));
      if (rows.length) {
        this.members = rows.map((m) => this.toOrgMember(m));
      }
    } catch {
      this.loadError = 'Could not load members from the server.';
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMemberModal();
  }

  scrollToInvite(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.getElementById('org-invite-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async createInvite(): Promise<void> {
    const gid = this.auth.groupId;
    if (!gid || !this.isOrgAdmin) {
      alert('Only a head farmer can create invites, and your session needs a group.');
      return;
    }
    try {
      const res = await firstValueFrom(this.api.createGroupInvite(gid));
      this.lastInviteCode = res.invitation?.code ?? null;
      const code = this.lastInviteCode ?? '';
      if (code && isPlatformBrowser(this.platformId) && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        alert(`Invite code copied: ${code}\nExpires: ${res.invitation?.expires_at ?? '—'}`);
      } else {
        alert(`Invite code: ${code}`);
      }
    } catch {
      alert('Could not create an invite. Try again when you are online.');
    }
  }

  openMemberModal(member: OrgMember): void {
    this.selectedMember = member;
  }

  closeMemberModal(): void {
    this.selectedMember = null;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('org-member-modal')) {
      this.closeMemberModal();
    }
  }

  canRemoveSelected(): boolean {
    if (!this.selectedMember || !this.isOrgAdmin) return false;
    return this.selectedMember.id !== this.currentUserId;
  }

  async removeSelectedFromOrg(): Promise<void> {
    if (!this.canRemoveSelected() || !this.selectedMember) return;
    const gid = this.auth.groupId;
    if (!gid) return;
    try {
      await firstValueFrom(this.api.removeGroupMember(gid, this.selectedMember.id));
      const id = this.selectedMember.id;
      this.members = this.members.filter((m) => m.id !== id);
      this.closeMemberModal();
    } catch {
      alert('Could not remove member.');
    }
  }

  messageMember(): void {
    if (!this.selectedMember) return;
    const id = this.selectedMember.id;
    this.closeMemberModal();
    void this.router.navigate(['/messages'], {
      queryParams: { receiver: id },
    });
  }

  nameInitial(member: OrgMember): string {
    const t = member.name.trim();
    return t ? t[0]!.toUpperCase() : '?';
  }

  approveJoinRequest(r: JoinRequest): void {
    const nextNumericId = Math.max(0, ...this.members.map((m) => Number.parseInt(m.id, 10) || 0)) + 1;
    const newId = String(nextNumericId);
    const handle = r.username.replace(/^@/, '') || 'member';
    const newMember: OrgMember = {
      id: newId,
      name: r.name,
      username: r.username,
      email: `${handle}@pending.local`,
      phone: '—',
      address: '—',
      role: 'Member',
      roleBadge: 'Farmer',
      registeredDeviceCount: 0,
    };
    this.members = [...this.members, newMember];
    this.notifications.removeJoinRequest(r.id);
  }

  declineJoinRequest(r: JoinRequest): void {
    this.notifications.removeJoinRequest(r.id);
  }

  joinRequestRelativeTime(iso: string): string {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return '';
    const diff = Date.now() - t;
    const d = Math.floor(diff / 86400000);
    if (d <= 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 7) return `${d} days ago`;
    return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  private toOrgMember(m: { user_id: string; display_name: string; role: string }): OrgMember {
    const handle = m.display_name.startsWith('@') ? m.display_name : `@${m.display_name.replace(/\s+/g, '_').toLowerCase()}`;
    const roleUpper = (m.role ?? '').toUpperCase();
    const roleBadge = roleUpper === 'HEAD' ? 'Admin' : 'Farmer';
    return {
      id: m.user_id,
      name: m.display_name,
      username: handle,
      email: '—',
      phone: '—',
      address: '—',
      role: roleUpper === 'HEAD' ? 'Admin' : 'Member',
      roleBadge,
      registeredDeviceCount: 0,
    };
  }
}
