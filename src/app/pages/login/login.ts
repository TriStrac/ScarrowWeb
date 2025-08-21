import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Needed for ngModel two-way binding
import { CommonModule } from '@angular/common'; // For structural directives like *ngIf
import { RouterModule, Router } from '@angular/router'; // Router used for navigation after successful login

@Component({
  selector: 'app-login', // Custom tag to use this component
  standalone: true, // Allows this component to be used independently
  imports: [CommonModule, FormsModule, RouterModule], // Import necessary Angular modules
  templateUrl: './login.html', // HTML structure
  styleUrls: ['./login.css'] // Styles specific to this component
})
export class LoginComponent {
  // Form field bindings
  phoneNumber = ''; // Holds user input for phone number
  password = ''; // Holds user input for password
  errorMessage = ''; // Used to display error messages

  // Injecting Angular Router for redirection
  constructor(private router: Router) {}

  // Function triggered when the Login button is clicked
  login() {
    this.errorMessage = ''; // Reset error message on every login attempt

    const trimmedPhoneNumber = this.phoneNumber.trim(); // Remove spaces
    const trimmedPassword = this.password.trim();

    // Run custom validation before proceeding
    //if (!this.validateInputs(trimmedPhoneNumber, trimmedPassword)) {
    //  return; // Stop if validation fails
    //}

    // Simulate login check — replace this later with actual login service
    if (trimmedPhoneNumber === 'admin' && trimmedPassword === 'admin') {
      alert('Login successful! Redirecting to dashboard...');
      this.router.navigate(['/dashboard']); // Redirect to dashboard
    } else {
      this.errorMessage = 'Invalid credentials. Please try again.';
    }
  }

  // Separate validation logic for better code structure
  validateInputs(phone: string, password: string): boolean {
    const phonePattern = /^(09|\+639)\d{9}$/; // Validates PH mobile number format

    if (!phone || !password) {
      this.errorMessage = 'Please fill in both phone number and password.';
      return false;
    }

    // Check if phone number format is valid
    if (!phonePattern.test(phone)) {
      // Note: <br> works because we use [innerHTML] binding in HTML
      this.errorMessage = 'Please enter a valid Philippine phone number<br>(e.g., 09123456789 or +639123456789).';
      return false;
    }

    // Optional: Add basic password length requirement
    if (password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return false;
    }

    return true; // All checks passed
  }
}
