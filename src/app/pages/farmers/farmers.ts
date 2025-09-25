import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalComponent } from '../../components/modal/modal.component';

// Import your modal component
// import { ModalComponent } from '../modal/modal.component'; // Adjust path as needed

@Component({
  selector: 'app-farmers',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent], // Add ModalComponent here when you import it
  templateUrl: './farmers.html',
  styleUrls: ['./farmers.css'],
  encapsulation: ViewEncapsulation.None // Add this for modal styling
})
export class FarmersComponent {
  searchTerm: string = '';

  farmers = [
    { id: 1, name: 'Hirono', deviceCount: 12, activeDeviceCount: 10 },
    { id: 2, name: 'Kelly', deviceCount: 10, activeDeviceCount: 10 },
    { id: 3, name: 'Leigh', deviceCount: 8, activeDeviceCount: 5 },
    { id: 4, name: 'Namie', deviceCount: 9, activeDeviceCount: 7 }
  ];

  // Modal properties
  isModalOpen = false;
  newFarmer = {
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  };

  // Edit modes for fields with change buttons
  editModes = {
    phone: false,
    address: false,
    password: false
  };

  showPassword = false;
  showConfirmPassword = false;

  constructor(private router: Router) {}

  filteredFarmers() {
    if (!this.searchTerm) return this.farmers;
    return this.farmers.filter(farmer =>
      farmer.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Open modal for adding farmer
  addFarmer() {
    // Reset form data
    this.newFarmer = {
      name: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      confirmPassword: ''
    };

    // Reset edit modes
    this.editModes = {
      phone: false,
      address: false,
      password: false
    };

    // Reset password visibility
    this.showPassword = false;
    this.showConfirmPassword = false;

    // Open modal
    this.isModalOpen = true;
  }

  // Close modal
  closeModal() {
    this.isModalOpen = false;
  }

  // Toggle edit mode for fields with change buttons
  toggleEditMode(field: keyof typeof this.editModes) {
    if (this.editModes[field]) {
      // Save the field (you can add validation here)
      console.log(`Saved ${field}:`, this.newFarmer[field]);
    }
    this.editModes[field] = !this.editModes[field];
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Create new farmer
  createUser() {
    // Basic validation
    if (!this.newFarmer.name || !this.newFarmer.email) {
      alert('Please fill in required fields (Name and Email)');
      return;
    }

    if (this.newFarmer.password !== this.newFarmer.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Create new farmer object
    const newId = Math.max(...this.farmers.map(f => f.id)) + 1;
    const farmer = {
      id: newId,
      name: this.newFarmer.name,
      deviceCount: Math.floor(Math.random() * 15) + 1,
      activeDeviceCount: Math.floor(Math.random() * 10) + 1
    };

    // Add to farmers array
    this.farmers.push(farmer);

    console.log('New farmer created:', farmer);
    console.log('Farmer details:', this.newFarmer);

    // Close modal
    this.closeModal();
  }

  goToFarmer(farmer: any) {
    this.router.navigate(['/farmer', farmer.id]);
  }

  deleteFarmer(farmer: any) {
    if (confirm(`Are you sure you want to delete ${farmer.name}?`)) {
      this.farmers = this.farmers.filter(f => f.id !== farmer.id);
    }
  }
}
