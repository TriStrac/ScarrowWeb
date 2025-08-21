import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // ✅ Added Router import

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class SignupComponent {
  constructor(private router: Router) {} // ✅ Inject the Router service

  step = 1;

  phoneNumber = '';
  password = '';
  confirmPassword = '';
  firstName = '';
  middleName = '';
  lastName = '';
  birthdate: string = '';

  streetName = '';
  barangay = '';
  townCity = '';
  province = '';
  zipCode = '';

  errorMessage = '';

  goToStep2() {
    if (!this.validateStep1()) return;
    this.errorMessage = '';
    this.step = 2;
  }

  signupFinal() {
    if (this.step === 2) {
      if (!this.validateStep2()) return;
      this.step = 3;
    } else if (this.step === 3) {
      if (!this.validateStep3()) return;
      this.submitForm();
    }
  }

  goBackStep1() {
    if (this.step > 1) this.step--;
  }

  validateStep1(): boolean {
    const phonePattern = /^(09|\+639)\d{9}$/;
    if (!this.phoneNumber || !phonePattern.test(this.phoneNumber)) {
      this.errorMessage = 'Please enter a valid Philippine phone number<br>(e.g., 09123456789 or +639123456789).';
      return false;
    }
    if (!this.password || this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return false;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return false;
    }
    return true;
  }

  validateStep2(): boolean {
    if (!this.firstName || !this.lastName || !this.birthdate) {
      this.errorMessage = 'Please fill in all required fields.';
      return false;
    }
    return true;
  }

  validateStep3(): boolean {
    if (!this.streetName || !this.barangay || !this.townCity || !this.province || !this.zipCode) {
      this.errorMessage = 'Please complete your address.';
      return false;
    }
    return true;
  }

  submitForm() {
    this.errorMessage = '';

    // 🔧 Simulate form submit / API call
    alert(`Submitting form with:
      Phone Number: ${this.phoneNumber}
      Password: ${this.password}
      Name: ${this.firstName} ${this.middleName} ${this.lastName}
      Birthdate: ${this.birthdate}
      Address: ${this.streetName}, ${this.barangay}, ${this.townCity}, ${this.province}, ${this.zipCode}`);


    // ✅ After successful signup, redirect to login
    this.router.navigate(['/login']);
  }
}
