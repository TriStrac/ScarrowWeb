import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

const TOKEN_KEY = 'scarrow_auth_token';
const USER_ID_KEY = 'scarrow_user_id';
const USERNAME_KEY = 'scarrow_username';
const GROUP_ID_KEY = 'scarrow_group_id';
const GROUP_NAME_KEY = 'scarrow_group_name';
const ROLE_KEY = 'scarrow_role';
const SUBSCRIPTION_STATUS_KEY = 'scarrow_subscription_status';
const PROFILE_COMPLETE_KEY = 'scarrow_profile_complete';

export interface SessionMe {
  user_id: string;
  username: string;
  role: string;
  group_id: string;
  group_name: string;
  subscription_status: string;
  profile_complete: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);

  get token(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  get userId(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(USER_ID_KEY);
  }

  get username(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(USERNAME_KEY);
  }

  get groupId(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(GROUP_ID_KEY);
  }

  get groupName(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(GROUP_NAME_KEY);
  }

  get role(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(ROLE_KEY);
  }

  get subscriptionStatus(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(SUBSCRIPTION_STATUS_KEY);
  }

  get profileComplete(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return localStorage.getItem(PROFILE_COMPLETE_KEY) === '1';
  }

  setSession(token: string, userId: string | null, username: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USERNAME_KEY, username);
    if (userId) {
      localStorage.setItem(USER_ID_KEY, userId);
    } else {
      localStorage.removeItem(USER_ID_KEY);
    }
  }

  /** Persist fields from `GET /users/me` (authoritative session for UI). */
  applySessionMe(me: SessionMe): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(USER_ID_KEY, me.user_id);
    localStorage.setItem(USERNAME_KEY, me.username);
    localStorage.setItem(GROUP_ID_KEY, me.group_id);
    localStorage.setItem(GROUP_NAME_KEY, me.group_name);
    localStorage.setItem(ROLE_KEY, me.role);
    localStorage.setItem(SUBSCRIPTION_STATUS_KEY, me.subscription_status);
    localStorage.setItem(PROFILE_COMPLETE_KEY, me.profile_complete ? '1' : '0');
  }

  clearSession(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(GROUP_ID_KEY);
    localStorage.removeItem(GROUP_NAME_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(SUBSCRIPTION_STATUS_KEY);
    localStorage.removeItem(PROFILE_COMPLETE_KEY);
  }
}
