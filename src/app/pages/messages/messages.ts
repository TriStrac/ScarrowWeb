import { isPlatformBrowser } from '@angular/common';
import { Component, ChangeDetectorRef, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { ScarrowApiService } from '../../services/scarrow-api.service';
import {
  ApiMessageThread,
  ApiThreadMessage,
  MessagesApiService,
} from '../../services/messages-api.service';
import { AuthService } from '../../services/auth.service';

export interface InboxItem {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  displayName?: string;
  organization?: string;
  contactSubtitle?: string;
  /** Other participant user id (for POST /messages/) */
  peerUserId?: string;
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
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './messages.html',
  styleUrls: ['./messages.css'],
})
export class MessagesComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly notifications = inject(NotificationService);
  private readonly scarrow = inject(ScarrowApiService);
  private readonly messagesApi = inject(MessagesApiService);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private sub?: Subscription;

  private readonly unreadStorageKey = 'scarrow_inbox_unread_v1';

  /** Excluded from compose list */
  private currentUserId = '';

  conversationId: string | null = null;
  contactView = false;
  inboxSearch = '';
  composeOpen = false;

  /** Composer */
  composerText = '';
  sending = false;
  threadLoadError = '';

  isLoadingInbox = true;
  inboxError = '';

  inbox: InboxItem[] = [];
  threads: Record<string, ThreadMessage[]> = {};

  /** Members for "new message" (from group API). */
  composeMembers: { id: string; name: string; username: string; roleBadge: string }[] = [];

  ngOnInit(): void {
    this.currentUserId = this.auth.userId ?? '';
    void this.loadComposeMembers();
    void this.bootstrapInbox();
    this.sub = this.route.queryParamMap.subscribe((params) => {
      void this.onQueryParams(params);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private async bootstrapInbox(): Promise<void> {
    await this.loadInboxFromApi();
    this.applyUnreadFromStorage();
    await this.refreshUnreadSummary();
    this.cdr.markForCheck();
  }

  private async loadComposeMembers(): Promise<void> {
    const gid = this.auth.groupId;
    if (!gid) return;
    try {
      const rows = await firstValueFrom(this.scarrow.getGroupMembers(gid));
      this.composeMembers = rows
        .filter((r) => r.user_id !== this.auth.userId)
        .map((r) => ({
          id: r.user_id,
          name: r.display_name,
          username: r.display_name.startsWith('@') ? r.display_name : `@${r.display_name}`,
          roleBadge: (r.role ?? '').toUpperCase() === 'HEAD' ? 'Admin' : 'Farmer',
        }));
      this.cdr.markForCheck();
    } catch {
      /* leave empty — compose list just won't show members */
    }
  }

  private async onQueryParams(params: ParamMap): Promise<void> {
    const receiver = params.get('receiver');

    if (receiver) {
      this.ensureReceiverThread(receiver);
      this.conversationId = `pending-${receiver}`;
      const c = params.get('contact');
      this.contactView = c === '1' || c === 'true';
      await this.loadThreadHistoryIfNeeded();
      this.cdr.markForCheck();
      return;
    }

    const thread = params.get('thread');
    this.conversationId = thread;
    const c = params.get('contact');
    if (!this.conversationId) {
      this.contactView = false;
      this.cdr.markForCheck();
      return;
    }
    this.contactView = c === '1' || c === 'true';
    if (thread) {
      this.markThreadRead(thread);
      await this.loadThreadHistoryIfNeeded();
    }
    this.cdr.markForCheck();
  }

  private ensureReceiverThread(receiverId: string): void {
    const existing = this.inbox.find((i) => i.id === `pending-${receiverId}`);
    if (existing) return;
    const fromOrg = this.composeMembers.find((m) => m.id === receiverId);
    const name = fromOrg?.name ?? 'Member';
    const item: InboxItem = {
      id: `pending-${receiverId}`,
      sender: name,
      displayName: name,
      subject: `Message ${name}`,
      preview: 'No messages yet — say hello.',
      time: 'Now',
      unread: false,
      organization: this.auth.groupName ?? 'Organization',
      contactSubtitle: 'Organization member',
      peerUserId: receiverId,
    };
    this.inbox = [item, ...this.inbox.filter((i) => i.id !== item.id)];
    this.threads = { ...this.threads, [item.id]: [] };
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

  contactPhone(): string {
    return '—';
  }

  currentThread(): ThreadMessage[] {
    if (!this.conversationId) return [];
    return this.threads[this.conversationId] ?? [];
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
    return this.composeMembers;
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
      queryParams: { receiver: memberId },
    });
  }

  canSend(): boolean {
    if (!this.conversationId || this.sending) return false;
    return this.resolveReceiverId() !== null && this.composerText.trim().length > 0;
  }

  async sendMessage(): Promise<void> {
    if (!this.canSend()) return;
    const receiverId = this.resolveReceiverId();
    if (!receiverId) return;
    const text = this.composerText.trim();
    this.sending = true;
    this.threadLoadError = '';
    try {
      await firstValueFrom(this.messagesApi.sendMessage(receiverId, text));
      this.composerText = '';
      if (this.conversationId?.startsWith('pending-')) {
        await this.loadInboxFromApi();
        const match = this.inbox.find((i) => i.peerUserId === receiverId && !i.id.startsWith('pending-'));
        if (match) {
          void this.router.navigate(['/messages'], { queryParams: { thread: match.id } });
        }
      } else if (this.conversationId) {
        await this.fetchAndStoreThread(this.conversationId);
      }
      await this.refreshUnreadSummary();
      this.pushUnreadCount();
    } catch {
      this.threadLoadError = 'Could not send message.';
    } finally {
      this.sending = false;
      this.cdr.markForCheck();
    }
  }

  private resolveReceiverId(): string | null {
    const item = this.currentInboxItem();
    if (item?.peerUserId) return item.peerUserId;
    if (this.conversationId?.startsWith('pending-')) {
      return this.conversationId.slice('pending-'.length);
    }
    return null;
  }

  private async loadThreadHistoryIfNeeded(): Promise<void> {
    const id = this.conversationId;
    if (!id || id.startsWith('pending-')) return;
    await this.fetchAndStoreThread(id);
  }

  private async fetchAndStoreThread(threadId: string): Promise<void> {
    if (threadId.startsWith('pending-')) return;
    try {
      const msgs = await firstValueFrom(this.messagesApi.getThreadMessages(threadId));
      const mapped = msgs.map((m, idx) => this.mapThreadMessage(m, idx));
      this.threads = { ...this.threads, [threadId]: mapped };
      this.cdr.markForCheck();
      void this.refreshUnreadSummary();
    } catch {
      this.threadLoadError = 'Could not load messages for this thread.';
      this.cdr.markForCheck();
    }
  }

  private mapThreadMessage(m: ApiThreadMessage, idx: number): ThreadMessage {
    const selfId = this.auth.userId;
    const senderId = m.sender_id;
    const body = m.content ?? m.body ?? '';
    const when = m.created_at ? new Date(m.created_at).toLocaleString() : '';
    return {
      id: m.id ?? `m-${idx}`,
      author: m.sender_name ?? (senderId && selfId && senderId === selfId ? 'You' : 'Member'),
      body,
      time: when,
      self: Boolean(selfId && senderId && senderId === selfId),
    };
  }

  private async loadInboxFromApi(): Promise<void> {
    this.isLoadingInbox = true;
    this.inboxError = '';
    try {
      const threads = await firstValueFrom(this.messagesApi.listThreads());
      if (Array.isArray(threads)) {
        this.inbox = threads.map((t) => this.toInboxItem(t));
        const mappedThreads: Record<string, ThreadMessage[]> = {};
        for (const t of threads) {
          mappedThreads[t.id] = [];
        }
        this.threads = mappedThreads;
      } else {
        this.inbox = [];
      }
      await this.refreshUnreadSummary();
    } catch {
      this.inboxError = 'Could not load messages. Check your connection.';
      this.inbox = [];
    } finally {
      this.isLoadingInbox = false;
      this.cdr.markForCheck();
    }
  }

  private async refreshUnreadSummary(): Promise<void> {
    try {
      const s = await firstValueFrom(this.messagesApi.getUnreadSummary());
      this.notifications.setUnreadMessageCount(s.unread_count ?? 0);
    } catch {
      this.pushUnreadCount();
    }
  }

  private toInboxItem(thread: ApiMessageThread): InboxItem {
    const peer =
      thread.other_user_id ?? thread.peer_user_id ?? thread.receiver_id;
    return {
      id: thread.id,
      sender: thread.sender_name ?? 'Conversation',
      displayName: thread.sender_name ?? 'Conversation',
      subject: thread.title ?? 'Message',
      preview: thread.latest_message ?? 'No messages yet.',
      time: this.toRelativeTime(thread.updated_at),
      unread: Boolean(thread.unread),
      organization: this.auth.groupName ?? 'Organization',
      contactSubtitle: 'Direct message contact',
      peerUserId: peer,
    };
  }

  private toRelativeTime(value?: string): string {
    if (!value) return 'Now';
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return 'Now';
    const diffMs = Math.max(0, Date.now() - parsed);
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
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
    if (!this.inbox[idx].unread) return;
    const next = [...this.inbox];
    next[idx] = { ...next[idx], unread: false };
    this.inbox = next;
    this.saveUnreadToStorage();
    void this.refreshUnreadSummary();
  }
}
