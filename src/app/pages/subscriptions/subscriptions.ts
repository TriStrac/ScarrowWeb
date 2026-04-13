import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ScarrowApiService, ApiSubscriptionPlan } from '../../services/scarrow-api.service';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './subscriptions.html',
  styleUrls: ['./subscriptions.css'],
})
export class SubscriptionsComponent implements OnInit {
  private readonly api = inject(ScarrowApiService);

  plans: ApiSubscriptionPlan[] = [];
  loadError = '';

  currentPlanId: string | null = null;
  currentStatus: string | null = null;
  currentStart: string | null = null;
  currentEnd: string | null = null;

  selectedPlanId: string | null = null;
  checkoutBusy = false;
  verifyBusy = false;
  verifyReferenceId = '';
  lastCheckoutUrl: string | null = null;

  async ngOnInit(): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.getSubscriptionPlans());
      this.plans = res.plans ?? [];
      if (this.plans.length && !this.selectedPlanId) {
        this.selectedPlanId = this.plans[0].id;
      }
    } catch {
      this.loadError = 'Could not load plans.';
    }
    await this.refreshMySubscription();
  }

  async refreshMySubscription(): Promise<void> {
    try {
      const my = await firstValueFrom(this.api.getMySubscription());
      const sub = my.subscription;
      if (!sub) {
        this.currentPlanId = null;
        this.currentStatus = null;
        this.currentStart = null;
        this.currentEnd = null;
        return;
      }
      this.currentPlanId = sub.plan_id;
      this.currentStatus = sub.status;
      this.currentStart = sub.start_date ?? null;
      this.currentEnd = sub.end_date ?? null;
    } catch {
      /* not signed in or endpoint unavailable */
    }
  }

  planLabel(planId: string | null): string {
    if (!planId) return 'None';
    const p = this.plans.find((x) => x.id === planId);
    return p?.name ?? planId;
  }

  async startCheckout(): Promise<void> {
    if (!this.selectedPlanId) {
      alert('Select a plan first.');
      return;
    }
    this.checkoutBusy = true;
    try {
      const res = await firstValueFrom(this.api.createSubscriptionCheckout(this.selectedPlanId));
      this.lastCheckoutUrl = res.checkout_url;
      if (res.checkout_url) {
        window.open(res.checkout_url, '_blank', 'noopener,noreferrer');
      }
      if (res.reference_id) {
        this.verifyReferenceId = res.reference_id;
      }
    } catch {
      alert('Checkout could not be started. Ensure you are signed in.');
    } finally {
      this.checkoutBusy = false;
    }
  }

  async verifyPayment(): Promise<void> {
    const ref = this.verifyReferenceId.trim();
    if (!ref) {
      alert('Paste the payment reference_id from checkout (or leave blank if your backend auto-confirms).');
      return;
    }
    this.verifyBusy = true;
    try {
      await firstValueFrom(this.api.verifySubscriptionPayment(ref));
      await this.refreshMySubscription();
      alert('Verification request sent. Refresh if status does not update yet.');
    } catch {
      alert('Verification failed.');
    } finally {
      this.verifyBusy = false;
    }
  }
}
