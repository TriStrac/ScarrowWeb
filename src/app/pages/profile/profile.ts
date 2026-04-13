import { Component, HostListener, OnDestroy, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ScarrowApiService } from '../../services/scarrow-api.service';

export type ProfileSectionId = 'account' | 'subscriptions' | 'notifications' | 'support' | 'terms';

export type AccountEditModalId =
  | 'password'
  | 'email'
  | 'name'
  | 'birthdate'
  | 'phone'
  | 'address';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ScarrowApiService);

  /** Accordions on small screens; sidebar + panel on wide screens */
  layout: 'compact' | 'wide' = 'wide';

  /** Active settings section (desktop only) */
  wideSection: ProfileSectionId = 'account';

  readonly sectionTitles: Record<ProfileSectionId, string> = {
    account: 'Account information',
    subscriptions: 'Subscriptions',
    notifications: 'Notifications',
    support: 'Contact support',
    terms: 'Terms and conditions',
  };

  readonly wideMenu: { id: ProfileSectionId; label: string; emoji?: string }[] = [
    { id: 'account', label: 'Account information' },
    { id: 'subscriptions', label: 'Subscriptions', emoji: '👑' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'support', label: 'Contact support' },
    { id: 'terms', label: 'Terms and conditions' },
  ];

  private mq?: MediaQueryList;
  private readonly mqHandler = () => this.applyLayout();

  accountEditModal: AccountEditModalId | null = null;

  readonly passwordMaskDisplay = '••••••••••••';

  readonly accountModalTitles: Record<AccountEditModalId, string> = {
    password: 'Change password',
    email: 'Edit email',
    name: 'Legal name',
    birthdate: 'Birthdate',
    phone: 'Phone number',
    address: 'Address',
  };

  deleteAccountModalOpen = false;
  deleteConfirmPhrase = '';

  accountDraft = {
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
    birthdate: '',
    phone: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  /** `username` is your login handle; legal name is first / middle / last. */
  user = {
    username: 'head_farmer_demo',
    firstName: 'Maria',
    middleName: 'Santos',
    lastName: 'Reyes',
    email: 'maria.reyes@email.com',
    phone: '(+63) 923 456 1234',
    address: 'Mandaue City, Cebu',
    birthdate: '',
  };

  role = 'HEAD FARMER';
  farmName = 'Scarrow Demo Farm';
  isPremium = true;

  selectedPlan: 'basic' | 'premium' = 'premium';

  subscriptionsFeaturesModal: 'basic' | 'premium' | null = null;

  readonly basicPlanFeatures: readonly string[] = [
    'Up to 2 active devices',
    'Real-time trigger alerts',
    'Weekly activity overview',
  ];

  readonly premiumPlanFeatures: readonly string[] = [
    'Unlimited devices and members',
    'Advanced analytics and export reports',
    'Priority support and alert tuning',
    'Early access to new monitoring tools',
  ];

  notifications = {
    emailDigest: true,
    deviceAlerts: true,
    billing: false,
  };

  readonly supportChannels = [
    {
      label: 'Email',
      value: 'scarrow@email.com',
      more: 'Best for detailed questions and attachments. We typically respond within 1–2 business days.',
    },
    {
      label: 'Landline',
      value: '(02) 8123 4567',
      more: 'Call during support hours for account and billing questions.',
    },
    {
      label: 'Mobile',
      value: '09535470539',
      more: 'Text or call for urgent device connectivity issues.',
    },
  ];

  readonly termsIntro =
    'These terms explain how you may use the Scarrow mobile application and related services. Please read them carefully.';

  readonly termsSections: { title: string; body: string }[] = [
    {
      title: 'Overview',
      body:
        "By downloading, accessing, or using Scarrow (the 'App'), you agree to these Terms and Conditions ('Terms'). If you do not agree, do not use the App. Scarrow is provided by the operator of the Scarrow service ('we,' 'us,' or 'our'). We may update these Terms from time to time; the effective date reflects the latest version.",
    },
    {
      title: 'Eligibility and accounts',
      body:
        'You must be able to form a binding contract under applicable law to use the App. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Notify us promptly through Contact Support if you suspect unauthorized access.',
    },
    {
      title: 'License to use the App',
      body:
        'We grant you a limited, non-exclusive, non-transferable, revocable license to install and use the App for your personal or internal business purposes in connection with monitoring and managing compatible devices and organizations you are authorized to access. You may not copy, modify, distribute, sell, lease, or reverse engineer the App except as allowed by law.',
    },
    {
      title: 'Devices and organizations',
      body:
        'The App may connect to hardware and third-party networks (for example Wi-Fi or cellular). You are responsible for complying with laws, regulations, and any agreements that apply to your equipment and locations. Features that involve organizations, memberships, or invites depend on actions by administrators and other users; we do not guarantee availability of any particular device or organizational feature.',
    },
    {
      title: 'Privacy and data',
      body:
        'Your use of the App may involve collection and processing of personal information and sensor or location-related data as described in our privacy practices and in-app settings. You agree not to use the App to collect or share data about others without proper authority and consent where required.',
    },
    {
      title: 'Disclaimers',
      body:
        "The App and all related services are provided 'as is' and 'as available.' To the fullest extent permitted by law, we disclaim warranties of merchantability, fitness for a particular purpose, and non-infringement. Monitoring and alerts are informational; you remain responsible for safety, compliance, and operational decisions on your farm or premises.",
    },
    {
      title: 'Limitation of liability',
      body:
        'To the maximum extent permitted by applicable law, we and our affiliates will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill, arising from your use of the App. Our total liability for any claim relating to the App is limited to the greater of (a) the amount you paid us for the App or related services in the twelve months before the claim, or (b) one hundred US dollars (US$100), unless a mandatory law provides otherwise.',
    },
    {
      title: 'Suspension and termination',
      body:
        'We may suspend or terminate access to the App if you violate these Terms, if required by law, or to protect the service or other users. You may stop using the App at any time. Provisions that by their nature should survive (including limitations of liability and dispute terms) will survive termination.',
    },
    {
      title: 'Contact',
      body:
        'For questions about these Terms, contact us through Contact Support in the App or at the email shown there. If you are a consumer, nothing in these Terms limits rights you may have under mandatory local consumer protection laws.',
    },
  ];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.layout = 'wide';
      return;
    }
    this.mq = window.matchMedia('(max-width: 899px)');
    this.applyLayout();
    this.mq.addEventListener('change', this.mqHandler);
    void this.loadProfileFromApi();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.mq) {
      this.mq.removeEventListener('change', this.mqHandler);
    }
  }

  private applyLayout(): void {
    if (!isPlatformBrowser(this.platformId) || !this.mq) {
      return;
    }
    const compact = this.mq.matches;
    this.layout = compact ? 'compact' : 'wide';
  }

  scrollToAccountSection(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.getElementById('profile-account-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  selectWideSection(id: ProfileSectionId): void {
    this.wideSection = id;
  }

  displayFullName(): string {
    const parts = [this.user.firstName, this.user.middleName, this.user.lastName]
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length ? parts.join(' ') : 'Not set';
  }

  subscriptionPlanLabel(): string {
    return this.selectedPlan === 'premium' ? 'Premium' : 'Basic';
  }

  openAccountEditModal(id: AccountEditModalId): void {
    this.accountEditModal = id;
    this.accountDraft = {
      email: this.user.email,
      firstName: this.user.firstName,
      middleName: this.user.middleName,
      lastName: this.user.lastName,
      birthdate: this.user.birthdate,
      phone: this.user.phone,
      address: this.user.address,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
  }

  closeAccountEditModal(): void {
    this.accountEditModal = null;
  }

  saveAccountEditModal(): void {
    const id = this.accountEditModal;
    if (!id) return;

    if (id === 'password') {
      if (!this.accountDraft.currentPassword.trim()) {
        alert('Enter your current password.');
        return;
      }
      if (this.accountDraft.newPassword !== this.accountDraft.confirmPassword) {
        alert('New password and confirmation do not match.');
        return;
      }
      if (this.accountDraft.newPassword.length < 8) {
        alert('New password must be at least 8 characters (demo rule).');
        return;
      }
      alert('Password updated (demo).');
      this.closeAccountEditModal();
      return;
    }

    if (id === 'email') {
      const e = this.accountDraft.email.trim();
      if (!e) {
        alert('Email cannot be empty.');
        return;
      }
      this.user.email = e;
    } else if (id === 'name') {
      if (!this.accountDraft.firstName.trim() || !this.accountDraft.lastName.trim()) {
        alert('First name and last name are required.');
        return;
      }
      this.user.firstName = this.accountDraft.firstName.trim();
      this.user.middleName = this.accountDraft.middleName.trim();
      this.user.lastName = this.accountDraft.lastName.trim();
    } else if (id === 'birthdate') {
      this.user.birthdate = this.accountDraft.birthdate;
    } else if (id === 'phone') {
      this.user.phone = this.accountDraft.phone.trim();
    } else if (id === 'address') {
      this.user.address = this.accountDraft.address.trim();
    }

    alert('Saved (demo).');
    this.closeAccountEditModal();
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(ev: KeyboardEvent): void {
    if (ev.key !== 'Escape') return;
    if (this.deleteAccountModalOpen) {
      this.closeDeleteAccountModal();
      return;
    }
    if (this.subscriptionsFeaturesModal !== null) {
      this.closeSubscriptionsFeaturesModal();
      return;
    }
    if (this.accountEditModal !== null) {
      this.closeAccountEditModal();
    }
  }

  openDeleteAccountModal(): void {
    this.deleteConfirmPhrase = '';
    this.deleteAccountModalOpen = true;
  }

  closeDeleteAccountModal(): void {
    this.deleteAccountModalOpen = false;
    this.deleteConfirmPhrase = '';
  }

  submitDeleteAccount(): void {
    if (this.deleteConfirmPhrase.trim() !== 'DELETE') {
      alert('Type DELETE in all caps to confirm.');
      return;
    }
    alert('Account permanently deleted (demo only).');
    this.closeDeleteAccountModal();
  }

  saveChanges() {
    alert('Changes saved (demo).');
  }

  selectPlan(plan: 'basic' | 'premium') {
    this.selectedPlan = plan;
  }

  openSubscriptionsFeaturesModal(plan: 'basic' | 'premium', ev?: Event): void {
    ev?.stopPropagation();
    this.subscriptionsFeaturesModal = plan;
  }

  closeSubscriptionsFeaturesModal(): void {
    this.subscriptionsFeaturesModal = null;
  }

  continueSubscription() {
    alert(
      this.selectedPlan === 'premium'
        ? 'Continue with Premium (checkout coming soon).'
        : 'You selected Basic (free).',
    );
  }

  restorePurchases() {
    alert('Restore purchases (demo).');
  }


  openMail() {
    window.location.href = 'mailto:scarrow@email.com?subject=Scarrow%20support';
  }

  private applySessionFromAuth(): void {
    if (this.auth.groupName) {
      this.farmName = this.auth.groupName;
    }
    const r = (this.auth.role ?? '').toUpperCase();
    if (r === 'HEAD') this.role = 'HEAD FARMER';
    else if (r) this.role = r.replace(/_/g, ' ');
    const st = this.auth.subscriptionStatus;
    if (st != null) {
      this.isPremium = st !== 'FREE';
    }
  }

  private async loadProfileFromApi(): Promise<void> {
    this.applySessionFromAuth();
    if (this.auth.token) {
      try {
        const me = await firstValueFrom(this.api.getMe());
        this.auth.applySessionMe(me);
        this.applySessionFromAuth();
      } catch {
        /* ignore */
      }
    }
    const userId = this.auth.userId;
    if (!userId) {
      if (this.auth.username) {
        this.user.username = this.auth.username;
      }
      return;
    }
    try {
      const response = await firstValueFrom(this.api.getUserProfile(userId));
      const user = response.user;
      if (!user) return;
      const firstName = user.profile?.first_name ?? this.user.firstName;
      const lastName = user.profile?.last_name ?? this.user.lastName;
      const phone = user.profile?.phone_number ?? this.user.phone;
      const addressParts = [user.address?.street_name, user.address?.town].filter(Boolean);
      this.user = {
        ...this.user,
        username: user.username ?? this.auth.username ?? this.user.username,
        firstName,
        lastName,
        phone,
        address: addressParts.length ? addressParts.join(', ') : this.user.address,
      };
    } catch {
      if (this.auth.username) {
        this.user.username = this.auth.username;
      }
    }
  }
}
