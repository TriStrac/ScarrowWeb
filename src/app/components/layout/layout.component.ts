import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MobileNavComponent } from '../mobile-nav/mobile-nav.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ScarrowApiService } from '../../services/scarrow-api.service';
import { MessagesApiService } from '../../services/messages-api.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, MobileNavComponent, CommonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ScarrowApiService);
  private readonly messagesApi = inject(MessagesApiService);
  private readonly notifications = inject(NotificationService);
  protected isMessagesRoute = false;

  constructor() {
    void this.refreshSessionAndBadges();

    const sync = () => {
      this.isMessagesRoute = this.router.url.split('?')[0].includes('/messages');
    };
    sync();
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => sync());
  }

  private async refreshSessionAndBadges(): Promise<void> {
    if (!this.auth.token) return;
    try {
      const me = await firstValueFrom(this.api.getMe());
      this.auth.applySessionMe(me);
    } catch {
      /* offline or expired */
    }
    try {
      const summary = await firstValueFrom(this.messagesApi.getUnreadSummary());
      this.notifications.setUnreadMessageCount(summary.unread_count ?? 0);
    } catch {
      /* optional */
    }
  }
}
