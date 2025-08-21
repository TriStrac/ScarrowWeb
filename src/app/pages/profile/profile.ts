import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent {
  // ✅ User profile data
  user = {
    name: 'Hirono',
    email: 'hirono@email.com',
    phone: '(+63) 923 456 1234',
    address: 'Mandaue City, Cebu',
    currentPassword: '********',
    newPassword: '',
    confirmPassword: '',
  };

  // ✅ Toggle show/hide password
  showNewPassword = false;
  showConfirmPassword = false;

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // ✅ Actions
  editUser() {
    alert('Edit user clicked!');
  }

  saveChanges() {
    alert('Changes saved successfully!');
  }

  changeField(field: string) {
    alert(`Change ${field} clicked!`);
  }
}
