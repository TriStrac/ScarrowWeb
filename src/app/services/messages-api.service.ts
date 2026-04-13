import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';

const API_BASE = 'https://scarrow-api.striel.xyz/api';

/** Thread row from `GET /messages/` */
export interface ApiMessageThread {
  id: string;
  sender_name?: string;
  title?: string;
  latest_message?: string;
  updated_at?: string;
  unread?: boolean;
  other_user_id?: string;
  peer_user_id?: string;
  receiver_id?: string;
}

export interface ApiUnreadSummary {
  unread_count: number;
}

export interface ApiThreadMessage {
  id?: string;
  content?: string;
  body?: string;
  sender_id?: string;
  created_at?: string;
  sender_name?: string;
}

interface ApiThreadHistoryResponse {
  messages?: ApiThreadMessage[];
  thread?: { messages?: ApiThreadMessage[] };
}

/**
 * HTTP client for the Messages API module (`/messages/*`).
 * Keeps all message-related calls in one place for the web app.
 */
@Injectable({ providedIn: 'root' })
export class MessagesApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  listThreads(limit = 50, offset = 0): Observable<ApiMessageThread[]> {
    return this.http
      .get<ApiMessageThread[] | { threads?: ApiMessageThread[] }>(`${API_BASE}/messages/`, {
        params: { limit: String(limit), offset: String(offset) },
        headers: this.authHeaders(),
      })
      .pipe(
        map((r) => {
          if (Array.isArray(r)) return r;
          if (r && typeof r === 'object' && 'threads' in r && Array.isArray((r as { threads: ApiMessageThread[] }).threads)) {
            return (r as { threads: ApiMessageThread[] }).threads;
          }
          return [];
        }),
      );
  }

  getUnreadSummary(): Observable<ApiUnreadSummary> {
    return this.http.get<ApiUnreadSummary>(`${API_BASE}/messages/unread-summary`, {
      headers: this.authHeaders(),
    });
  }

  getThreadMessages(threadId: string, limit = 50, offset = 0): Observable<ApiThreadMessage[]> {
    return this.http
      .get<ApiThreadMessage[] | ApiThreadHistoryResponse>(
        `${API_BASE}/messages/${encodeURIComponent(threadId)}`,
        {
          params: { limit: String(limit), offset: String(offset) },
          headers: this.authHeaders(),
        },
      )
      .pipe(
        map((r) => {
          if (Array.isArray(r)) return r;
          const obj = r as ApiThreadHistoryResponse;
          if (obj?.messages && Array.isArray(obj.messages)) return obj.messages;
          if (obj?.thread?.messages && Array.isArray(obj.thread.messages)) return obj.thread.messages;
          return [];
        }),
      );
  }

  sendMessage(receiverId: string, content: string): Observable<unknown> {
    return this.http.post(
      `${API_BASE}/messages/`,
      { receiver_id: receiverId, content },
      { headers: this.authHeaders() },
    );
  }

  private authHeaders(): HttpHeaders {
    const token = this.auth.token;
    if (!token) {
      return new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }
}
