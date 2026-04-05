import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class ProfileComponent {
  user = {
    name: 'Hirono',
    email: 'hirono@email.com',
    phone: '(+63) 923 456 1234',
    address: 'Mandaue City, Cebu',
    currentPassword: '********',
    newPassword: '',
    confirmPassword: '',
  };

  subscription = {
    plan: 'Professional',
    renews: 'April 15, 2026',
    status: 'Active',
  };

  notifications = {
    emailDigest: true,
    deviceAlerts: true,
    billing: false,
  };

  supportEmail = 'support@scarrow.app';

  showNewPassword = false;
  showConfirmPassword = false;

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  editUser() {
    alert('Edit profile (connect to API).');
  }

  saveChanges() {
    alert('Changes saved (demo).');
  }

  changeField(field: string) {
    alert(`Change ${field} (demo).`);
  }

  contactSupport() {
    window.location.href = `mailto:${this.supportEmail}?subject=Scarrow%20support`;
  }
}
