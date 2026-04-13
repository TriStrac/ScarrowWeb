import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthService, SessionMe } from './auth.service';

const PROD_API_BASE = 'https://scarrow-api.striel.xyz/api';

export interface LoginStepOneResponse {
  message: string;
  identifier: string;
}

export interface VerifyLoginResponse {
  token: string;
}

export interface ApiDevice {
  id: string;
  name?: string;
  device_type?: string;
  status?: string;
  last_activated_at?: string;
  updated_at?: string;
}

export interface ApiUserProfileResponse {
  user?: {
    id?: string;
    username?: string;
    subscription_status?: string;
    profile?: {
      first_name?: string;
      last_name?: string;
      phone_number?: string;
    };
    address?: {
      street_name?: string;
      town?: string;
    };
  };
}

export interface ApiActivityLog {
  id?: string;
  action?: string;
  message?: string;
  created_at?: string;
  timestamp?: string;
  actor_name?: string;
  user?: string;
}

export interface ApiGroupDetails {
  id: string;
  name: string;
  owner_id?: string;
  role?: string;
  member_count?: number;
  settings?: Record<string, unknown>;
}

export interface ApiGroupMember {
  user_id: string;
  display_name: string;
  role: string;
}

export interface ApiInviteResponse {
  invitation: {
    code: string;
    group_id: string;
    expires_at: string;
  };
}

export interface ApiReportsSummary {
  overview?: {
    total_alerts?: number;
    total_devices?: number;
  };
  pest_distribution?: Record<string, number>;
  daily_trends?: { count: number; date: string }[];
  timeframe?: string;
}

export interface ApiSubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price?: number;
  duration_days?: number;
}

export interface ApiPlansResponse {
  plans: ApiSubscriptionPlan[];
}

export interface ApiMySubscriptionResponse {
  subscription: {
    id: string;
    plan_id: string;
    status: string;
    start_date?: string;
    end_date?: string;
  } | null;
}

export interface ApiCheckoutResponse {
  checkout_url: string;
  reference_id: string;
}

export interface ApiNotification {
  id: string;
  title?: string;
  message?: string;
  read?: boolean;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ScarrowApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  login(username: string, password: string): Observable<LoginStepOneResponse> {
    return this.http.post<LoginStepOneResponse>(`${PROD_API_BASE}/users/login`, {
      username,
      password,
    });
  }

  verifyLogin(identifier: string, code: string): Observable<VerifyLoginResponse> {
    return this.http.post<VerifyLoginResponse>(`${PROD_API_BASE}/users/verify-login`, {
      identifier,
      code,
    });
  }

  getMe(): Observable<SessionMe> {
    return this.http.get<SessionMe>(`${PROD_API_BASE}/users/me`, {
      headers: this.authHeaders(),
    });
  }

  getUserProfile(userId: string): Observable<ApiUserProfileResponse> {
    return this.http.get<ApiUserProfileResponse>(`${PROD_API_BASE}/users/${userId}`, {
      headers: this.authHeaders(),
    });
  }

  getMyDevices(): Observable<ApiDevice[]> {
    return this.http.get<ApiDevice[] | { devices?: ApiDevice[] }>(`${PROD_API_BASE}/device/my`, {
      headers: this.authHeaders(),
    }).pipe(map((r) => this.asDeviceArray(r)));
  }

  getDeviceLogs(deviceId: string, limit = 50, offset = 0): Observable<unknown[]> {
    return this.http
      .get<unknown[] | { logs?: unknown[] }>(
        `${PROD_API_BASE}/device/${encodeURIComponent(deviceId)}/logs`,
        {
          params: { limit: String(limit), offset: String(offset) },
          headers: this.authHeaders(),
        },
      )
      .pipe(
        map((r) => {
          if (Array.isArray(r)) return r;
          if (r && typeof r === 'object' && 'logs' in r && Array.isArray((r as { logs: unknown[] }).logs)) {
            return (r as { logs: unknown[] }).logs;
          }
          return [];
        }),
      );
  }

  getGroup(groupId: string): Observable<ApiGroupDetails> {
    return this.http.get<ApiGroupDetails>(`${PROD_API_BASE}/groups/${encodeURIComponent(groupId)}`, {
      headers: this.authHeaders(),
    });
  }

  getGroupMembers(groupId: string): Observable<ApiGroupMember[]> {
    return this.http
      .get<ApiGroupMember[] | { members?: ApiGroupMember[] }>(
        `${PROD_API_BASE}/groups/${encodeURIComponent(groupId)}/members`,
        { headers: this.authHeaders() },
      )
      .pipe(
        map((r) => {
          if (Array.isArray(r)) return r;
          if (r && typeof r === 'object' && 'members' in r && Array.isArray((r as { members: ApiGroupMember[] }).members)) {
            return (r as { members: ApiGroupMember[] }).members;
          }
          return [];
        }),
      );
  }

  createGroupInvite(groupId: string): Observable<ApiInviteResponse> {
    return this.http.post<ApiInviteResponse>(
      `${PROD_API_BASE}/groups/${encodeURIComponent(groupId)}/invite`,
      {},
      { headers: this.authHeaders() },
    );
  }

  joinGroup(code: string): Observable<unknown> {
    return this.http.post(`${PROD_API_BASE}/groups/join`, { code }, { headers: this.authHeaders() });
  }

  removeGroupMember(groupId: string, userId: string): Observable<unknown> {
    return this.http.request('delete', `${PROD_API_BASE}/groups/member`, {
      body: { group_id: groupId, user_id: userId },
      headers: this.authHeaders(),
    });
  }

  leaveGroup(groupId: string): Observable<unknown> {
    return this.http.post(`${PROD_API_BASE}/groups/leave`, { group_id: groupId }, { headers: this.authHeaders() });
  }

  getReportsSummary(timeframe: string): Observable<ApiReportsSummary> {
    return this.http.get<ApiReportsSummary>(`${PROD_API_BASE}/reports/summary`, {
      params: { timeframe },
      headers: this.authHeaders(),
    });
  }

  getSubscriptionPlans(): Observable<ApiPlansResponse> {
    return this.http.get<ApiPlansResponse>(`${PROD_API_BASE}/subscriptions/plans`);
  }

  getMySubscription(): Observable<ApiMySubscriptionResponse> {
    return this.http.get<ApiMySubscriptionResponse>(`${PROD_API_BASE}/subscriptions/my`, {
      headers: this.authHeaders(),
    });
  }

  createSubscriptionCheckout(planId: string): Observable<ApiCheckoutResponse> {
    return this.http.post<ApiCheckoutResponse>(
      `${PROD_API_BASE}/subscriptions/checkout`,
      { plan_id: planId },
      { headers: this.authHeaders() },
    );
  }

  verifySubscriptionPayment(referenceId: string): Observable<unknown> {
    return this.http.post(
      `${PROD_API_BASE}/subscriptions/verify`,
      { reference_id: referenceId },
      { headers: this.authHeaders() },
    );
  }

  getMyNotifications(): Observable<ApiNotification[]> {
    return this.http
      .get<ApiNotification[] | { notifications?: ApiNotification[] }>(`${PROD_API_BASE}/notifications/my`, {
        headers: this.authHeaders(),
      })
      .pipe(
        map((r) => {
          if (Array.isArray(r)) return r;
          if (
            r &&
            typeof r === 'object' &&
            'notifications' in r &&
            Array.isArray((r as { notifications: ApiNotification[] }).notifications)
          ) {
            return (r as { notifications: ApiNotification[] }).notifications;
          }
          return [];
        }),
      );
  }

  markNotificationRead(notificationId: string): Observable<unknown> {
    return this.http.patch(
      `${PROD_API_BASE}/notifications/${encodeURIComponent(notificationId)}/read`,
      {},
      { headers: this.authHeaders() },
    );
  }

  markAllNotificationsRead(): Observable<unknown> {
    return this.http.patch(`${PROD_API_BASE}/notifications/read-all`, {}, { headers: this.authHeaders() });
  }

  getMyActivityLogs(): Observable<ApiActivityLog[]> {
    return this.http.get<ApiActivityLog[]>(`${PROD_API_BASE}/activityLogs/my`, {
      headers: this.authHeaders(),
    });
  }

  decodeUserIdFromJwt(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
        user_id?: string;
        sub?: string;
      };
      return payload.user_id ?? payload.sub ?? null;
    } catch {
      return null;
    }
  }

  private asDeviceArray(r: ApiDevice[] | { devices?: ApiDevice[] }): ApiDevice[] {
    if (Array.isArray(r)) return r;
    if (r && typeof r === 'object' && 'devices' in r && Array.isArray((r as { devices: ApiDevice[] }).devices)) {
      return (r as { devices: ApiDevice[] }).devices;
    }
    return [];
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
