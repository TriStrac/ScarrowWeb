import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError, map } from 'rxjs';
import { AuthService, SessionMe } from './auth.service';

const PROD_API_BASE = '';

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

/** One telemetry / deterrence event from GET /device/:id/logs */
export interface ApiDeviceLog {
  id?: string;
  time_triggered?: string;
  created_at?: string;
  pest_class?: string;
  animal?: string;
  frequency_hz?: number;
  duration_seconds?: number;
  duration_display?: string;
  event?: string;
  detail?: string;
  node_device?: string;
  message?: string;
}

/** POST /api/device/ */
export interface ApiCreateDeviceRequest {
  name: string;
  owner_type: 'USER';
  device_type: 'NODE' | 'CENTRAL';
  parent_id?: string;
}

export interface ApiCreateDeviceResponse {
  id: string;
  name?: string;
  device_type?: string;
  status?: string;
}

/** POST /api/hubs/register - Raspberry Pi central hub */
export interface ApiRegisterHubRequest {
  name: string;
  location_lat: number;
  location_lng: number;
}

export interface ApiRegisterHubResponse {
  hub_id: string;
  secret: string;
  status: string;
}

/** POST /api/nodes/register - ESP32 field node */
export interface ApiRegisterNodeRequest {
  hub_id: string;
  node_type: string;
  label: string;
}

export interface ApiRegisterNodeResponse {
  node_id: string;
  node_secret: string;
  hub_filter: string;
  status: string;
}

export interface ApiUserProfileResponse {
  user?: {
    id?: string;
    username?: string;
    email?: string;
    group_id?: string | null;
    is_user_in_group?: boolean;
    is_user_head?: boolean;
    subscription_status?: string;
    profile?: {
      first_name?: string;
      middle_name?: string;
      last_name?: string;
      phone_number?: string;
      birthdate?: string;
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

export interface ApiHubReport {
  hub_id?: string;
  total_events?: number;
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

export interface ApiHubCommandRequest {
  command: string;
  args?: Record<string, unknown>;
}

export interface ApiHubCommandResponse {
  status: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ScarrowApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  login(username: string, password: string): Observable<LoginStepOneResponse> {
    return this.http.post<LoginStepOneResponse>(`${PROD_API_BASE}/api/users/login`, {
      username,
      password,
    }).pipe(
      catchError((err: HttpErrorResponse) => {
        const message = err.error?.error || err.error?.message || err.statusText || 'Login failed';
        return throwError(() => ({ message, status: err.status }));
      })
    );
  }

  verifyLogin(identifier: string, code: string): Observable<VerifyLoginResponse> {
    return this.http.post<VerifyLoginResponse>(`${PROD_API_BASE}/api/users/verify-login`, {
      identifier,
      code,
    });
  }

  /** POST /api/users/forgot-password - request OTP for password reset */
  forgotPassword(username: string): Observable<{ message: string; identifier?: string }> {
    return this.http.post<{ message: string; identifier?: string }>(
      `${PROD_API_BASE}/api/users/forgot-password`,
      { username },
    );
  }

  /** POST /api/users/reset-password - submit OTP + new password */
  resetPassword(username: string, otp: string, new_password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${PROD_API_BASE}/api/users/reset-password`,
      { username, otp, new_password },
    );
  }

  /** POST /api/users/resend-otp - resend OTP for login or forgot-password flows */
  resendOtp(identifier: string, purpose: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${PROD_API_BASE}/api/users/resend-otp`,
      { identifier, purpose },
    );
  }

  getMe(): Observable<SessionMe> {
    return this.http.get<SessionMe>(`${PROD_API_BASE}/api/users/me`, {
      headers: this.authHeaders(),
    });
  }

  getUserProfile(userId: string): Observable<ApiUserProfileResponse> {
    return this.http.get<ApiUserProfileResponse>(`${PROD_API_BASE}/api/users/${userId}`, {
      headers: this.authHeaders(),
    });
  }

  getMyDevices(): Observable<ApiDevice[]> {
    return this.http
      .get<ApiDevice[] | { devices?: ApiDevice[] }>(`${PROD_API_BASE}/api/device/my`, {
        headers: this.authHeaders(),
      })
      .pipe(map((r) => this.asDeviceArray(r)));
  }

  getDeviceLogs(deviceId: string, limit = 50, offset = 0): Observable<ApiDeviceLog[]> {
    return this.http
      .get<ApiDeviceLog[] | { logs?: ApiDeviceLog[] }>(
        `${PROD_API_BASE}/api/device/${encodeURIComponent(deviceId)}/logs`,
        {
          params: { limit: String(limit), offset: String(offset) },
          headers: this.authHeaders(),
        },
      )
      .pipe(
        map((r) => {
          if (Array.isArray(r)) return r;
          if (
            r &&
            typeof r === 'object' &&
            'logs' in r &&
            Array.isArray((r as { logs: ApiDeviceLog[] }).logs)
          ) {
            return (r as { logs: ApiDeviceLog[] }).logs;
          }
          return [];
        }),
      );
  }

  /** POST /api/device/ - create a device record (NODE or CENTRAL) */
  createDevice(req: ApiCreateDeviceRequest): Observable<ApiCreateDeviceResponse> {
    return this.http.post<ApiCreateDeviceResponse>(
      `${PROD_API_BASE}/api/device/`,
      req,
      { headers: this.authHeaders() },
    );
  }

  /** POST /api/hubs/register - provision a Raspberry Pi central hub */
  registerHub(req: ApiRegisterHubRequest): Observable<ApiRegisterHubResponse> {
    return this.http.post<ApiRegisterHubResponse>(
      `${PROD_API_BASE}/api/hubs/register`,
      req,
      { headers: this.authHeaders() },
    );
  }

  /** POST /api/nodes/register - provision an ESP32 field node */
  registerNode(req: ApiRegisterNodeRequest): Observable<ApiRegisterNodeResponse> {
    return this.http.post<ApiRegisterNodeResponse>(
      `${PROD_API_BASE}/api/nodes/register`,
      req,
      { headers: this.authHeaders() },
    );
  }

  /** POST /api/hubs/:hubId/commands - send a command to a hub (reboot, wifi, reset, node_reset) */
  sendHubCommand(hubId: string, command: string, args?: Record<string, unknown>): Observable<ApiHubCommandResponse> {
    const body: ApiHubCommandRequest = { command };
    if (args) body.args = args;
    return this.http.post<ApiHubCommandResponse>(
      `${PROD_API_BASE}/api/hubs/${encodeURIComponent(hubId)}/commands`,
      body,
      { headers: this.authHeaders() },
    );
  }

  getGroup(groupId: string): Observable<ApiGroupDetails> {
    return this.http.get<ApiGroupDetails>(
      `${PROD_API_BASE}/api/groups/${encodeURIComponent(groupId)}`,
      { headers: this.authHeaders() },
    );
  }

  getGroupMembers(groupId: string): Observable<ApiGroupMember[]> {
    return this.http
      .get<ApiGroupMember[] | { members?: ApiGroupMember[] }>(
        `${PROD_API_BASE}/api/groups/${encodeURIComponent(groupId)}/members`,
        { headers: this.authHeaders() },
      )
      .pipe(
        map((r) => {
          if (Array.isArray(r)) return r;
          if (
            r &&
            typeof r === 'object' &&
            'members' in r &&
            Array.isArray((r as { members: ApiGroupMember[] }).members)
          ) {
            return (r as { members: ApiGroupMember[] }).members;
          }
          return [];
        }),
      );
  }

  /** GET /api/groups/:groupId/members/:userId/devices  (HEAD role required) */
  getMemberDevices(groupId: string, userId: string): Observable<ApiDevice[]> {
    return this.http
      .get<ApiDevice[] | { devices?: ApiDevice[] }>(
        `${PROD_API_BASE}/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}/devices`,
        { headers: this.authHeaders() },
      )
      .pipe(map((r) => this.asDeviceArray(r)));
  }

  /** GET /api/groups/:groupId/members/:userId/activity-logs  (HEAD role required) */
  getMemberActivityLogs(groupId: string, userId: string): Observable<ApiActivityLog[]> {
    return this.http
      .get<ApiActivityLog[] | { logs?: ApiActivityLog[] }>(
        `${PROD_API_BASE}/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}/activity-logs`,
        { headers: this.authHeaders() },
      )
      .pipe(
        map((r) => {
          if (Array.isArray(r)) return r;
          if (r && typeof r === 'object' && 'logs' in r && Array.isArray((r as { logs: ApiActivityLog[] }).logs)) {
            return (r as { logs: ApiActivityLog[] }).logs;
          }
          return [];
        }),
      );
  }

  createGroupInvite(groupId: string): Observable<ApiInviteResponse> {
    return this.http.post<ApiInviteResponse>(
      `${PROD_API_BASE}/api/groups/${encodeURIComponent(groupId)}/invite`,
      {},
      { headers: this.authHeaders() },
    );
  }

  joinGroup(code: string): Observable<unknown> {
    return this.http.post(
      `${PROD_API_BASE}/api/groups/join`,
      { code },
      { headers: this.authHeaders() },
    );
  }

  removeGroupMember(groupId: string, userId: string): Observable<unknown> {
    return this.http.request('delete', `${PROD_API_BASE}/api/groups/member`, {
      body: { group_id: groupId, user_id: userId },
      headers: this.authHeaders(),
    });
  }

  leaveGroup(groupId: string): Observable<unknown> {
    return this.http.post(
      `${PROD_API_BASE}/api/groups/leave`,
      { group_id: groupId },
      { headers: this.authHeaders() },
    );
  }

  /** DELETE /api/groups/:groupId - disband the group (HEAD role required) */
  disbandGroup(groupId: string): Observable<unknown> {
    return this.http.delete(
      `${PROD_API_BASE}/api/groups/${encodeURIComponent(groupId)}`,
      { headers: this.authHeaders() },
    );
  }

  getReportsSummary(timeframe: string): Observable<ApiReportsSummary> {
    return this.http.get<ApiReportsSummary>(`${PROD_API_BASE}/api/reports/summary`, {
      params: { timeframe },
      headers: this.authHeaders(),
    });
  }

  /** GET /api/reports/hub/:hubId - hub-specific deterrence report */
  getHubReport(hubId: string, startDate?: string, endDate?: string): Observable<ApiHubReport> {
    let params = new HttpParams();
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    return this.http.get<ApiHubReport>(
      `${PROD_API_BASE}/api/reports/hub/${encodeURIComponent(hubId)}`,
      { params, headers: this.authHeaders() },
    );
  }

  getSubscriptionPlans(): Observable<ApiPlansResponse> {
    return this.http.get<ApiPlansResponse>(`${PROD_API_BASE}/api/subscriptions/plans`);
  }

  getMySubscription(): Observable<ApiMySubscriptionResponse> {
    return this.http.get<ApiMySubscriptionResponse>(`${PROD_API_BASE}/api/subscriptions/my`, {
      headers: this.authHeaders(),
    });
  }

  createSubscriptionCheckout(planId: string): Observable<ApiCheckoutResponse> {
    return this.http.post<ApiCheckoutResponse>(
      `${PROD_API_BASE}/api/subscriptions/checkout`,
      { plan_id: planId },
      { headers: this.authHeaders() },
    );
  }

  verifySubscriptionPayment(referenceId: string): Observable<unknown> {
    return this.http.post(
      `${PROD_API_BASE}/api/subscriptions/verify`,
      { reference_id: referenceId },
      { headers: this.authHeaders() },
    );
  }

  getMyNotifications(): Observable<ApiNotification[]> {
    return this.http
      .get<ApiNotification[] | { notifications?: ApiNotification[] }>(
        `${PROD_API_BASE}/api/notifications/my`,
        { headers: this.authHeaders() },
      )
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
      `${PROD_API_BASE}/api/notifications/${encodeURIComponent(notificationId)}/read`,
      {},
      { headers: this.authHeaders() },
    );
  }

  markAllNotificationsRead(): Observable<unknown> {
    return this.http.patch(
      `${PROD_API_BASE}/api/notifications/read-all`,
      {},
      { headers: this.authHeaders() },
    );
  }

  getMyActivityLogs(): Observable<ApiActivityLog[]> {
    return this.http.get<ApiActivityLog[]>(`${PROD_API_BASE}/api/activityLogs/my`, {
      headers: this.authHeaders(),
    });
  }

  decodeUserIdFromJwt(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      ) as { user_id?: string; sub?: string };
      return payload.user_id ?? payload.sub ?? null;
    } catch {
      return null;
    }
  }

  private asDeviceArray(r: ApiDevice[] | { devices?: ApiDevice[] }): ApiDevice[] {
    if (Array.isArray(r)) return r;
    if (
      r &&
      typeof r === 'object' &&
      'devices' in r &&
      Array.isArray((r as { devices: ApiDevice[] }).devices)
    ) {
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
  /** GET /api/hubs/my - list hubs registered by the current user */
  getMyHubs(): Observable<ApiDevice[]> {
    return this.http
      .get<ApiDevice[] | { hubs?: ApiDevice[] }>(`${PROD_API_BASE}/api/hubs/my`, {
        headers: this.authHeaders(),
      })
      .pipe(
        map((r) => {
          if (Array.isArray(r)) return r;
          if (r && typeof r === 'object' && 'hubs' in r && Array.isArray((r as { hubs: ApiDevice[] }).hubs)) {
            return (r as { hubs: ApiDevice[] }).hubs;
          }
          return [];
        }),
      );
  }

  /** DELETE /api/hubs/:hubId - delete a hub (HEAD role required) */
  deleteHub(hubId: string): Observable<unknown> {
    return this.http.delete(
      `${PROD_API_BASE}/api/hubs/${encodeURIComponent(hubId)}`,
      { headers: this.authHeaders() },
    );
  }

  /** GET /api/nodes/my - list nodes registered by the current user */
  getMyNodes(): Observable<ApiDevice[]> {
    return this.http
      .get<ApiDevice[] | { nodes?: ApiDevice[] }>(`${PROD_API_BASE}/api/nodes/my`, {
        headers: this.authHeaders(),
      })
      .pipe(
        map((r) => {
          if (Array.isArray(r)) return r;
          if (r && typeof r === 'object' && 'nodes' in r && Array.isArray((r as { nodes: ApiDevice[] }).nodes)) {
            return (r as { nodes: ApiDevice[] }).nodes;
          }
          return [];
        }),
      );
  }

  /** DELETE /api/nodes/:nodeId - delete a node */
  deleteNode(nodeId: string): Observable<unknown> {
    return this.http.delete(
      `${PROD_API_BASE}/api/nodes/${encodeURIComponent(nodeId)}`,
      { headers: this.authHeaders() },
    );
  }

  /** DELETE /api/device/:deviceId - delete a device record */
  deleteDevice(deviceId: string): Observable<unknown> {
    return this.http.delete(
      `${PROD_API_BASE}/api/device/${encodeURIComponent(deviceId)}`,
      { headers: this.authHeaders() },
    );
  }

  /** GET /api/notifications/poll - long-poll for new notifications since a timestamp */
  pollNotifications(since?: string): Observable<ApiNotification[]> {
    let params = new HttpParams();
    if (since) params = params.set('since', since);
    return this.http
      .get<ApiNotification[] | { notifications?: ApiNotification[] }>(
        `${PROD_API_BASE}/api/notifications/poll`,
        { params, headers: this.authHeaders() },
      )
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

  /** DELETE /api/users/:userId/hard - permanently delete a user account (admin only) */
  hardDeleteUser(userId: string): Observable<unknown> {
    return this.http.delete(
      `${PROD_API_BASE}/api/users/${encodeURIComponent(userId)}/hard`,
      { headers: this.authHeaders() },
    );
  }


}

// ── Injected below authHeaders() by alignment pass ───────────────────────
// These are appended before the closing brace of the cl