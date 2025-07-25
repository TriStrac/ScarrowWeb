import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class SignupComponent {
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';

  signup() {
    const trimmedEmail = this.email.trim();
    const trimmedPassword = this.password.trim();
    const trimmedConfirmPassword = this.confirmPassword.trim();

    // Clear previous error
    this.errorMessage = '';

    // Check for empty fields
    if (!trimmedEmail || !trimmedPassword || !trimmedConfirmPassword) {
      this.errorMessage = 'All fields are required.';
      return;
    }

    // Email format check
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    // Password length check (optional but recommended)
    if (trimmedPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return;
    }

    // Confirm password match
    if (trimmedPassword !== trimmedConfirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    // ✅ If all validation passes
    this.errorMessage = '';
    alert('Signup successful! Proceeding to next step...');
    // Redirect or further logic here
  }
}
