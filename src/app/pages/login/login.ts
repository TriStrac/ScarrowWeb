import { Component, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ModalComponent } from '../../components/modal/modal.component';
import { AuthService } from '../../services/auth.service';
import { ScarrowApiService } from '../../services/scarrow-api.service';

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
  otpIdentifier = '';
  isSubmitting = false;

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private router: Router,
    private api: ScarrowApiService,
    private auth: AuthService,
  ) {}

  private focusOtpBox(index: number): void {
    setTimeout(() => {
      const el = this.otpInputs?.toArray()[index]?.nativeElement;
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
      this.maskedPhone = 'your registered number';
      this.otpDigits = ['', '', '', '', '', ''];
      this.otpFocusIndex = 0;
      this.showOtpModal = true;
      this.focusOtpBox(0);
    } catch {
      this.loginError = 'Invalid username or password.';
    } finally {
      this.isSubmitting = false;
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
      try {
        const me = await firstValueFrom(this.api.getMe());
        this.auth.applySessionMe(me);
      } catch {
        /* session extras optional until backend is reachable */
      }
      this.showOtpModal = false;
      await this.router.navigate(['/dashboard']);
    } catch {
      this.otpError = 'Invalid code. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  async resendCode(): Promise<void> {
    if (this.isSubmitting) return;
    this.otpError = '';
    const name = this.username.trim();
    if (!name) {
      this.showOtpModal = false;
      return;
    }
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
