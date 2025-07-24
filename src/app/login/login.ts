import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // For ngModel two-way binding
import { CommonModule } from '@angular/common'; // For common directives like ngIf
import { RouterModule } from '@angular/router'; // For routerLink or future navigation

@Component({
  selector: 'app-login', // Component tag name
  standalone: true, // Allows this component to be used independently
  imports: [CommonModule, FormsModule, RouterModule], // Import required modules for this component
  templateUrl: './login.html', // HTML template file
  styleUrls: ['./login.css'] // CSS styles file
})
export class LoginComponent {
  // Properties bound to input fields
  email = '';
  password = '';
  errorMessage = ''; // Property to hold error messages for display in the template

  // Function that runs when the Login button is clicked
  login() {
    // Remove whitespace from email and password
    const trimmedEmail = this.email.trim();
    const trimmedPassword = this.password.trim();

    // Clear previous error message
    this.errorMessage = '';

    // Check if either field is empty
    if (!trimmedEmail || !trimmedPassword) {
      this.errorMessage = 'Please fill in both email and password.';
      return; // Stop execution if invalid
    }

    // Check if email format is invalid (basic check)
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    // Validate hardcoded login credentials (admin/admin)
    if (trimmedEmail === 'admin' && trimmedPassword === 'admin') {
      alert('Login successful! Redirecting to dashboard...');
      console.log('Redirecting to /dashboard...');
      // TODO: Add router navigation here in the future
    } else {
      // If credentials are incorrect
      this.errorMessage = 'Invalid credentials. Please try again.';
    }
  }
}
