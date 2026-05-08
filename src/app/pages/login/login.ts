import { Component, ViewChildren, QueryList, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ScarrowApiService } from '../../services/scarrow-api.service';

type ForgotStep = 'off' | 'username' | 'otp' | 'newpass' | 'done';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  username = '';
  password = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  otpIndices = [0, 1, 2, 3, 4, 5];
  otpFocusIndex = 0;
  showOtpModal = false;
  loginError = '';
  otpError = '';
  otpIdentifier = '';
  isSubmitting = false;

  // ── Forgot Password state ──────────────────────────────────────────────────
  forgotStep: ForgotStep = 'off';
  forgotUsername = '';
  forgotIdentifier = '';
  forgotOtpDigits: string[] = ['', '', '', '', '', ''];
  forgotOtpIndices = [0, 1, 2, 3, 4, 5];
  forgotOtpFocusIndex = 0;
  forgotNewPass = '';
  forgotConfirmPass = '';
  forgotError = '';
  forgotSuccess = '';
  forgotSubmitting = false;
  forgotShowNewPass = false;
  forgotShowConfirmPass = false;

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('forgotOtpInput') forgotOtpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private router: Router,
    private api: ScarrowApiService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  private focusOtpBox(index: number): void {
    setTimeout(() => {
      const el = this.otpInputs?.toArray()[index]?.nativeElement;
      el?.focus();
      el?.select();
    });
  }

  private focusForgotOtpBox(index: number): void {
    setTimeout(() => {
      const el = this.forgotOtpInputs?.toArray()[index]?.nativeElement;
      el?.focus();
      el?.select();
    });
  }

  /** Step 1: validate username/password, then request OTP from API. */
  async submitLogin(): Promise<void> {
    if (this.isSubmitting) return;
    this.loginError = '';
    this.otpError = '';
    const name = this.username.trim();
    const pass = this.password;
    if (!name || !pass) {
      this.loginError = 'Please enter your username and password.';
      return;
    }
    this.isSubmitting = true;
    try {
      const response = await firstValueFrom(this.api.login(name, pass));
      this.otpIdentifier = response.identifier || name;
      this.otpDigits = ['', '', '', '', '', ''];
      this.otpFocusIndex = 0;
      this.showOtpModal = true;
      this.cdr.markForCheck();
      this.focusOtpBox(0);
    } catch (err: any) {
      this.loginError = err?.message || 'Invalid username or password. Please try again.';
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  async verifyAndLogin(): Promise<void> {
    if (this.isSubmitting) return;
    this.otpError = '';
    const entered = this.otpDigits.join('');
    if (entered.length !== 6) {
      this.otpError = 'Please enter the complete 6-digit code.';
      return;
    }
    this.isSubmitting = true;
    try {
      const response = await firstValueFrom(this.api.verifyLogin(this.otpIdentifier, entered));
      const userId = this.api.decodeUserIdFromJwt(response.token);
      this.auth.setSession(response.token, userId, this.username.trim());

      // Verify the account role — only HEAD (Head Farmer) may access this portal
      try {
        const me = await firstValueFrom(this.api.getMe());
        this.auth.applySessionMe(me);
        if ((me.role ?? '').toUpperCase() !== 'HEAD') {
          this.auth.clearSession();
          this.otpError = 'Access denied. This portal is for Head Farmer accounts only.';
          this.cdr.markForCheck();
          return;
        }
      } catch {
        this.auth.clearSession();
        this.otpError = 'Could not verify account role. Please try again.';
        this.cdr.markForCheck();
        return;
      }

      // Verify is_user_head flag from user profile
      if (userId) {
        try {
          const profile = await firstValueFrom(this.api.getUserProfile(userId));
          if (!profile.user?.is_user_head) {
            this.auth.clearSession();
            this.otpError = 'Access denied. Head Farmer verification failed.';
            this.cdr.markForCheck();
            return;
          }
        } catch {
          this.auth.clearSession();
          this.otpError = 'Could not verify account status. Please try again.';
          this.cdr.markForCheck();
          return;
        }
      }

      this.showOtpModal = false;
      this.cdr.markForCheck();
      await this.router.navigate(['/dashboard']);
    } catch {
      this.otpError = 'Invalid or expired code. Please try again.';
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  async resendCode(): Promise<void> {
    if (this.isSubmitting) return;
    this.otpError = '';
    const name = this.username.trim();
    if (!name) { this.showOtpModal = false; return; }
    this.isSubmitting = true;
    try {
      const response = await firstValueFrom(this.api.login(name, this.password));
      this.otpIdentifier = response.identifier || name;
      this.otpDigits = ['', '', '', '', '', ''];
      this.otpFocusIndex = 0;
      this.focusOtpBox(0);
    } catch {
      this.otpError = 'Unable to resend code right now.';
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
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
    for (let i = 0; i < 6; i++) { next.push(digits[i] ?? ''); }
    this.otpDigits = next;
    const nextEmpty = this.otpDigits.findIndex((d) => !d);
    const focusAt = nextEmpty === -1 ? 5 : nextEmpty;
    this.otpFocusIndex = focusAt;
    this.focusOtpBox(focusAt);
  }

  get displayUsername(): string {
    return this.username.trim();
  }

  // ── Forgot Password ────────────────────────────────────────────────────────

  openForgotPassword(): void {
    this.forgotStep = 'username';
    this.forgotUsername = '';
    this.forgotIdentifier = '';
    this.forgotOtpDigits = ['', '', '', '', '', ''];
    this.forgotOtpFocusIndex = 0;
    this.forgotNewPass = '';
    this.forgotConfirmPass = '';
    this.forgotError = '';
    this.forgotSuccess = '';
    this.forgotSubmitting = false;
  }

  closeForgotPassword(): void {
    this.forgotStep = 'off';
    this.forgotError = '';
  }

  async submitForgotUsername(): Promise<void> {
    this.forgotError = '';
    const uname = this.forgotUsername.trim();
    if (!uname) { this.forgotError = 'Please enter your username.'; return; }
    this.forgotSubmitting = true;
    try {
      const res = await firstValueFrom(this.api.forgotPassword(uname));
      this.forgotIdentifier = res.identifier ?? uname;
      this.forgotOtpDigits = ['', '', '', '', '', ''];
      this.forgotOtpFocusIndex = 0;
      this.forgotStep = 'otp';
      this.cdr.markForCheck();
      this.focusForgotOtpBox(0);
    } catch {
      this.forgotError = 'Could not send reset code. Check your username and try again.';
    } finally {
      this.forgotSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  async resendForgotOtp(): Promise<void> {
    this.forgotError = '';
    this.forgotSubmitting = true;
    try {
      await firstValueFrom(this.api.resendOtp(this.forgotIdentifier, 'FORGOT_PASSWORD'));
      this.forgotOtpDigits = ['', '', '', '', '', ''];
      this.forgotOtpFocusIndex = 0;
      this.forgotSuccess = 'Code resent.';
      this.cdr.markForCheck();
      this.focusForgotOtpBox(0);
      setTimeout(() => { this.forgotSuccess = ''; this.cdr.markForCheck(); }, 3000);
    } catch {
      this.forgotError = 'Could not resend code. Please try again.';
    } finally {
      this.forgotSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  submitForgotOtp(): void {
    this.forgotError = '';
    const entered = this.forgotOtpDigits.join('');
    if (entered.length !== 6) {
      this.forgotError = 'Please enter the complete 6-digit code.';
      return;
    }
    this.forgotStep = 'newpass';
  }

  async submitNewPassword(): Promise<void> {
    this.forgotError = '';
    const pass = this.forgotNewPass;
    const confirm = this.forgotConfirmPass;
    if (!pass || pass.length < 8) {
      this.forgotError = 'Password must be at least 8 characters.';
      return;
    }
    if (pass !== confirm) {
      this.forgotError = 'Passwords do not match.';
      return;
    }
    this.forgotSubmitting = true;
    try {
      const otp = this.forgotOtpDigits.join('');
      await firstValueFrom(this.api.resetPassword(this.forgotUsername.trim(), otp, pass));
      this.forgotStep = 'done';
      this.cdr.markForCheck();
    } catch {
      this.forgotError = 'Reset failed. The code may have expired — go back and request a new one.';
    } finally {
      this.forgotSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  onForgotOtpDigit(value: string, index: number): void {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...this.forgotOtpDigits];
    next[index] = digit;
    this.forgotOtpDigits = next;
    if (digit && index < 5) {
      this.forgotOtpFocusIndex = index + 1;
      this.focusForgotOtpBox(index + 1);
    }
  }

  onForgotOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.forgotOtpDigits[index] && index > 0) {
      this.forgotOtpFocusIndex = index - 1;
      this.focusForgotOtpBox(index - 1);
    }
  }

  onForgotOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';
    const digits = text.replace(/\D/g, '').slice(0, 6).split('');
    const next: string[] = [];
    for (let i = 0; i < 6; i++) { next.push(digits[i] ?? ''); }
    this.forgotOtpDigits = next;
    const nextEmpty = this.forgotOtpDigits.findIndex((d) => !d);
    const focusAt = nextEmpty === -1 ? 5 : nextEmpty;
    this.forgotOtpFocusIndex = focusAt;
    this.focusForgotOtpBox(focusAt);
  }
}
