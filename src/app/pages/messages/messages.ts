import { isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, ParamMap, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import {
  DEMO_ORG_MEMBERS,
  DEMO_ORG_NAME,
  dmThreadIdForMember,
  getOrgMemberById,
} from '../../data/demo-org-members';

export interface InboxItem {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  /** Shown on the contact screen; defaults to sender */
  displayName?: string;
  phone?: string;
  organization?: string;
  contactSubtitle?: string;
}

export interface ThreadMessage {
  id: string;
  author: string;
  body: string;
  time: string;
  self: boolean;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './messages.html',
  styleUrls: ['./messages.css'],
})
export class MessagesComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly notifications = inject(NotificationService);
  private sub?: Subscription;

  private readonly unreadStorageKey = 'scarrow_inbox_unread_v1';

  /** Demo signed-in user — same id as Organization “Head Admin”; excluded from compose list. */
  readonly demoCurrentUserId = '1';

  conversationId: string | null = null;
  contactView = false;

  /** Filter inbox list (name, preview, subject). */
  inboxSearch = '';

  /** “New message” picker (organization members). */
  composeOpen = false;

  inbox: InboxItem[] = [
    {
      id: '1',
      sender: 'System',
      subject: 'Device sync completed',
      preview: 'North Field Sensor finished uploading logs…',
      time: '2h ago',
      unread: true,
      phone: '+1 (555) 010-1000',
      organization: 'Scarrow',
      contactSubtitle: 'Direct message contact',
    },
    {
      id: '2',
      sender: 'Maria Santos',
      subject: 'Weekly field report',
      preview: 'Attached summary for Zone A moisture readings…',
      time: 'Yesterday',
      unread: false,
      phone: '+63 917 000 0000',
      organization: 'Green Valley Co-op',
      contactSubtitle: 'Direct message contact',
    },
    {
      id: '3',
      sender: 'Scarrow Support',
      displayName: 'Scarrow Support',
      subject: 'Subscription renewal',
      preview: 'Your plan renews on the 15th. Reply with questions.',
      time: 'Mon',
      unread: false,
      phone: '+1 (555) 010-1001',
      organization: 'Scarrow',
      contactSubtitle: 'Direct message contact',
    },
  ];

  threads: Record<string, ThreadMessage[]> = {
    '1': [
      { id: 'a', author: 'System', body: 'North Field Sensor finished uploading logs at 09:42.', time: '10:12', self: false },
      { id: 'b', author: 'You', body: 'Thanks — I will review the dashboard.', time: '10:18', self: true },
    ],
    '2': [
      { id: 'a', author: 'Maria Santos', body: 'Hi team, here is the weekly summary for Zone A.', time: 'Mon 08:00', self: false },
      { id: 'b', author: 'You', body: 'Received. Adding to the org report.', time: 'Mon 09:15', self: true },
    ],
    '3': [
      {
        id: 'a',
        author: 'Scarrow Support',
        body: 'Hello, your subscription renews soon. Need help with billing?',
        time: '09:00',
        self: false,
      },
    ],
  };

  ngOnInit(): void {
    this.applyUnreadFromStorage();
    this.pushUnreadCount();
    this.sub = this.route.queryParamMap.subscribe((params) => {
      this.applyContactVisibilityFromParams(params);
      const thread = params.get('thread');
      if (thread) {
        this.markThreadRead(thread);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /**
   * Contact panel only when `contact=1` or `contact=true` (opened via the info button).
   * Legacy `user` query (without `thread`) redirects to `thread=dm-{userId}`.
   */
  private applyContactVisibilityFromParams(params: ParamMap): void {
    const user = params.get('user');
    const thread = params.get('thread');
    if (user && !thread) {
      void this.router.navigate(['/messages'], {
        queryParams: { thread: dmThreadIdForMember(user) },
        replaceUrl: true,
      });
      return;
    }

    this.conversationId = thread;
    const c = params.get('contact');
    if (!this.conversationId) {
      this.contactView = false;
      return;
    }
    this.ensureDirectMessageThread(this.conversationId);
    this.contactView = c === '1' || c === 'true';
  }

  /**
   * Org DMs use ids `dm-{memberId}` so they never collide with system threads `1`, `2`, `3`.
   * Creates inbox row + empty thread when messaging a member from Organization (or Compose).
   */
  private ensureDirectMessageThread(conversationId: string): void {
    if (!conversationId.startsWith('dm-')) return;
    if (this.inbox.some((i) => i.id === conversationId)) return;

    const memberId = conversationId.slice('dm-'.length);
    const member = getOrgMemberById(memberId);
    if (!member) return;

    const item: InboxItem = {
      id: conversationId,
      sender: member.name,
      displayName: member.name,
      subject: `Message ${member.name}`,
      preview: 'No messages yet — say hello.',
      time: 'Now',
      unread: false,
      phone: member.phone,
      organization: DEMO_ORG_NAME,
      contactSubtitle: 'Organization member',
    };
    this.inbox = [...this.inbox, item];
    this.threads = { ...this.threads, [conversationId]: [] };
  }

  openThread(id: string): void {
    this.markThreadRead(id);
    void this.router.navigate(['/messages'], { queryParams: { thread: id } });
  }

  backToInbox(): void {
    void this.router.navigate(['/messages']);
  }

  openContact(): void {
    if (!this.conversationId) return;
    void this.router.navigate(['/messages'], {
      queryParams: { thread: this.conversationId, contact: '1' },
    });
  }

  closeContact(): void {
    if (!this.conversationId) return;
    void this.router.navigate(['/messages'], {
      queryParams: { thread: this.conversationId, contact: '0' },
    });
  }

  toggleContactPanel(): void {
    if (!this.conversationId) return;
    if (this.contactView) {
      this.closeContact();
    } else {
      this.openContact();
    }
  }

  currentInboxItem(): InboxItem | undefined {
    if (!this.conversationId) return undefined;
    return this.inbox.find((i) => i.id === this.conversationId);
  }

  contactDisplayName(): string {
    const item = this.currentInboxItem();
    return item?.displayName ?? item?.sender ?? 'Contact';
  }

  contactPhone(): string {
    return this.currentInboxItem()?.phone ?? '—';
  }

  contactOrganization(): string {
    return this.currentInboxItem()?.organization ?? '—';
  }

  contactSubtitle(): string {
    return this.currentInboxItem()?.contactSubtitle ?? 'Direct message contact';
  }

  contactInitial(): string {
    const name = this.contactDisplayName();
    const letter = name.trim().charAt(0);
    return letter ? letter.toUpperCase() : '?';
  }

  currentThread(): ThreadMessage[] {
    if (!this.conversationId) return [];
    return this.threads[this.conversationId] ?? [];
  }

  currentSubject(): string {
    const item = this.inbox.find((i) => i.id === this.conversationId);
    return item?.subject ?? 'Conversation';
  }

  threadHeaderName(): string {
    const item = this.currentInboxItem();
    return item?.displayName ?? item?.sender ?? 'Conversation';
  }

  filteredInbox(): InboxItem[] {
    const q = this.inboxSearch.trim().toLowerCase();
    if (!q) return this.inbox;
    return this.inbox.filter((i) => {
      const name = (i.displayName ?? i.sender).toLowerCase();
      return (
        name.includes(q) ||
        i.preview.toLowerCase().includes(q) ||
        i.subject.toLowerCase().includes(q)
      );
    });
  }

  composeableMembers() {
    return DEMO_ORG_MEMBERS.filter((m) => m.id !== this.demoCurrentUserId);
  }

  openCompose(): void {
    this.composeOpen = true;
  }

  closeCompose(): void {
    this.composeOpen = false;
  }

  startDmWithMember(memberId: string): void {
    this.closeCompose();
    this.inboxSearch = '';
    void this.router.navigate(['/messages'], {
      queryParams: { thread: dmThreadIdForMember(memberId) },
    });
  }

  private applyUnreadFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const raw = localStorage.getItem(this.unreadStorageKey);
      if (!raw) return;
      const map = JSON.parse(raw) as Record<string, boolean>;
      this.inbox = this.inbox.map((i) => ({ ...i, unread: map[i.id] ?? i.unread }));
    } catch {
      /* ignore */
    }
  }

  private saveUnreadToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const map: Record<string, boolean> = {};
      for (const i of this.inbox) {
        map[i.id] = i.unread;
      }
      localStorage.setItem(this.unreadStorageKey, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }

  private pushUnreadCount(): void {
    const n = this.inbox.filter((i) => i.unread).length;
    this.notifications.setUnreadMessageCount(n);
  }

  private markThreadRead(id: string): void {
    const idx = this.inbox.findIndex((i) => i.id === id);
    if (idx === -1) return;
    if (!this.inbox[idx].unread) {
      return;
    }
    const next = [...this.inbox];
    next[idx] = { ...next[idx], unread: false };
    this.inbox = next;
    this.saveUnreadToStorage();
    this.pushUnreadCount();
  }
}
