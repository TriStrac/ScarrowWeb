import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { NotificationService, JoinRequest } from '../../services/notification.service';
import {
  OrgMember,
  DEMO_ORG_MEMBERS,
  dmThreadIdForMember,
} from '../../data/demo-org-members';

export type { OrgMember } from '../../data/demo-org-members';

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './organization.html',
  styleUrls: ['./organization.css'],
})
export class OrganizationComponent {
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  /** Pending users who asked to join (shown to org admins). */
  readonly joinRequests = toSignal(this.notifications.joinRequests, { initialValue: [] as JoinRequest[] });

  organizationName = 'Scarrow Demo Farm';

  /** Demo: signed-in user id — cannot remove yourself */
  currentUserId = '1';

  /** Demo: org admin can remove others from the modal */
  isOrgAdmin = true;

  members: OrgMember[] = [...DEMO_ORG_MEMBERS];

  selectedMember: OrgMember | null = null;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMemberModal();
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

  removeSelectedFromOrg(): void {
    if (!this.canRemoveSelected() || !this.selectedMember) return;
    const id = this.selectedMember.id;
    this.members = this.members.filter((m) => m.id !== id);
    this.closeMemberModal();
  }

  messageMember(): void {
    if (!this.selectedMember) return;
    const id = this.selectedMember.id;
    this.closeMemberModal();
    void this.router.navigate(['/messages'], {
      queryParams: { thread: dmThreadIdForMember(id) },
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
}
