import { Component, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ModalComponent } from '../../components/modal/modal.component';

/** Replace with API: validate credentials then trigger OTP delivery. */
const MOCK_USERS: Record<string, { phone: string; password: string }> = {
  msgeared2000: { phone: '09535470539', password: 'msgeared2000' },
  admin: { phone: '09123456789', password: 'admin' },
};

const OTP_TTL_MS = 10 * 60 * 1000;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  username = '';
  password = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  otpIndices = [0, 1, 2, 3, 4, 5];
  otpFocusIndex = 0;
  maskedPhone = '';
  showOtpModal = false;
  loginError = '';
  otpError = '';

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(private router: Router) {}

  private focusOtpBox(index: number): void {
    setTimeout(() => {
      const el = this.otpInputs?.toArray()[index]?.nativeElement;
      el?.focus();
      el?.select();
    });
  }

  private findUser(name: string): { phone: string; password: string } | undefined {
    const key = name.trim().toLowerCase();
    return MOCK_USERS[key];
  }

  /** Step 1: username + password, then open 2FA modal with issued OTP (demo: local only). */
  submitLogin(): void {
    this.loginError = '';
    const name = this.username.trim();
    const pass = this.password;
    if (!name || !pass) {
      this.loginError = 'Please enter your username and password.';
      return;
    }
    const user = this.findUser(name);
    if (!user || user.password !== pass) {
      this.loginError = 'Invalid username or password.';
      return;
    }
    this.maskedPhone = user.phone;
    this.issueOtp(name);
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpFocusIndex = 0;
    this.otpError = '';
    this.showOtpModal = true;
    this.focusOtpBox(0);
  }

  private issueOtp(forUsername: string): void {
    const code = '123456';
    sessionStorage.setItem(
      `otp_${forUsername.toLowerCase()}`,
      JSON.stringify({ code, exp: Date.now() + OTP_TTL_MS }),
    );
    console.info('[Demo OTP]', forUsername, '→', code);
  }

  verifyAndLogin(): void {
    this.otpError = '';
    const entered = this.otpDigits.join('');
    if (entered.length !== 6) {
      this.otpError = 'Please enter the complete 6-digit code.';
      return;
    }
    const key = this.username.trim().toLowerCase();
    const raw = sessionStorage.getItem(`otp_${key}`);
    if (!raw) {
      this.otpError = 'Code expired or missing. Request a new code.';
      return;
    }
    let parsed: { code: string; exp: number };
    try {
      parsed = JSON.parse(raw) as { code: string; exp: number };
    } catch {
      this.otpError = 'Invalid session. Please sign in again.';
      return;
    }
    if (Date.now() > parsed.exp) {
      sessionStorage.removeItem(`otp_${key}`);
      this.otpError = 'Code expired. Tap Resend code.';
      return;
    }
    if (entered !== parsed.code) {
      this.otpError = 'Invalid code. Please try again.';
      return;
    }
    sessionStorage.removeItem(`otp_${key}`);
    this.showOtpModal = false;
    this.router.navigate(['/dashboard']);
  }

  resendCode(): void {
    this.otpError = '';
    const name = this.username.trim();
    if (!name) {
      this.showOtpModal = false;
      return;
    }
    this.issueOtp(name);
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpFocusIndex = 0;
    this.focusOtpBox(0);
  }

  onOtpModalClose(): void {
    this.showOtpModal = false;
    this.otpError = '';
    this.otpDigits = ['', '', '', '', '', ''];
  }

  onOtpDigit(value: string, index: number): void {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...this.otpDigits];
    next[index] = digit;
    this.otpDigits = next;
    if (digit && index < 5) {
      this.otpFocusIndex = index + 1;
      this.focusOtpBox(index + 1);
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      this.otpFocusIndex = index - 1;
      this.focusOtpBox(index - 1);
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';
    const digits = text.replace(/\D/g, '').slice(0, 6).split('');
    const next: string[] = [];
    for (let i = 0; i < 6; i++) {
      next.push(digits[i] ?? '');
    }
    this.otpDigits = next;
    const nextEmpty = this.otpDigits.findIndex((d) => !d);
    const focusAt = nextEmpty === -1 ? 5 : nextEmpty;
    this.otpFocusIndex = focusAt;
    this.focusOtpBox(focusAt);
  }

  get displayUsername(): string {
    return this.username.trim();
  }
}
