import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';

export interface JoinRequest {
  id: string;
  name: string;
  username: string;
  requestedAt: string;
}

const LS_JOIN = 'scarrow_join_requests_v1';

const DEFAULT_JOIN_REQUESTS: JoinRequest[] = [
  {
    id: 'jr-1',
    name: 'Carlos Mendoza',
    username: '@carlos_m',
    requestedAt: new Date('2026-04-04T12:00:00').toISOString(),
  },
  {
    id: 'jr-2',
    name: 'Luisa Guevarra',
    username: '@luisa_g',
    requestedAt: new Date('2026-04-05T08:30:00').toISOString(),
  },
];

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly joinRequests$ = new BehaviorSubject<JoinRequest[]>(this.loadJoinRequests());
  private readonly unreadMessages$ = new BehaviorSubject<number>(0);

  readonly joinRequests: Observable<JoinRequest[]> = this.joinRequests$.asObservable();
  readonly unreadMessageCount: Observable<number> = this.unreadMessages$.asObservable();

  /** Sum of pending join requests and unread message threads. */
  readonly totalCount$: Observable<number> = combineLatest([this.joinRequests$, this.unreadMessages$]).pipe(
    map(([joins, msgs]) => joins.length + msgs),
  );

  /** Used to animate the bell when there are unread messages. */
  readonly hasUnreadMessages$: Observable<boolean> = this.unreadMessages$.pipe(map((n) => n > 0));

  readonly summary$: Observable<{
    joinRequests: JoinRequest[];
    joinCount: number;
    unreadMessages: number;
    total: number;
  }> = combineLatest([this.joinRequests$, this.unreadMessages$]).pipe(
    map(([joinRequests, unreadMessages]) => ({
      joinRequests,
      joinCount: joinRequests.length,
      unreadMessages,
      total: joinRequests.length + unreadMessages,
    })),
  );

  setUnreadMessageCount(count: number): void {
    const n = Math.max(0, Math.floor(count));
    this.unreadMessages$.next(n);
  }

  removeJoinRequest(id: string): void {
    const next = this.joinRequests$.value.filter((r) => r.id !== id);
    this.persistJoinRequests(next);
  }

  private loadJoinRequests(): JoinRequest[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [];
    }
    try {
      const raw = localStorage.getItem(LS_JOIN);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as JoinRequest[];
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      /* keep defaults */
    }
    localStorage.setItem(LS_JOIN, JSON.stringify(DEFAULT_JOIN_REQUESTS));
    return DEFAULT_JOIN_REQUESTS;
  }

  private persistJoinRequests(requests: JoinRequest[]): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(LS_JOIN, JSON.stringify(requests));
    }
    this.joinRequests$.next(requests);
  }
}
