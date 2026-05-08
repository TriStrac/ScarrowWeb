import { Component, ChangeDetectorRef, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ModalComponent } from '../../components/modal/modal.component';
import { AuthService } from '../../services/auth.service';
import { ScarrowApiService } from '../../services/scarrow-api.service';

export type FarmerRow = {
  id: string;
  name: string;
  deviceCount: number;
  activeDeviceCount: number;
};

@Component({
  selector: 'app-farmers',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './farmers.html',
  styleUrls: ['./farmers.css'],
  encapsulation: ViewEncapsulation.None,
})
export class FarmersComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ScarrowApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  searchTerm = '';
  isLoading = true;
  loadError = '';

  farmers: FarmerRow[] = [];

  isModalOpen = false;
  newFarmer = {
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  };

  editModes = {
    phone: false,
    address: false,
    password: false,
  };

  showPassword = false;
  showConfirmPassword = false;

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.loadError = '';
    const gid = this.auth.groupId;
    if (!gid) {
      this.loadError = 'Sign in to load your organization roster.';
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }
    try {
      const rows = await firstValueFrom(this.api.getGroupMembers(gid));
      this.farmers = rows
        .filter((m) => (m.role ?? '').toUpperCase() !== 'HEAD')
        .map((m) => ({
          id: m.user_id,
          name: m.display_name,
          deviceCount: 0,
          activeDeviceCount: 0,
        }));
    } catch {
      this.loadError = 'Could not load farmers from the server.';
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  filteredFarmers(): FarmerRow[] {
    if (!this.searchTerm) return this.farmers;
    return this.farmers.filter((farmer) =>
      farmer.name.toLowerCase().includes(this.searchTerm.toLowerCase()),
    );
  }

  addFarmer(): void {
    this.newFarmer = {
      name: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      confirmPassword: '',
    };
    this.editModes = { phone: false, address: false, password: false };
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  toggleEditMode(field: keyof typeof this.editModes): void {
    this.editModes[field] = !this.editModes[field];
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  createUser(): void {
    if (!this.newFarmer.name || !this.newFarmer.email) {
      alert('Please fill in required fields (Name and Email)');
      return;
    }
    if (this.newFarmer.password !== this.newFarmer.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    alert('To add a member, share an invite code from the Organization page. New accounts are registered through the mobile app.');
    this.closeModal();
  }

  goToFarmer(farmer: FarmerRow): void {
    void this.router.navigate(['/farmer', farmer.id]);
  }

  deleteFarmer(farmer: FarmerRow): void {
    if (confirm(`Remove ${farmer.name} from the organization?`)) {
      const gid = this.auth.groupId;
      if (!gid) return;
      void firstValueFrom(this.api.removeGroupMember(gid, farmer.id))
        .then(() => {
          this.farmers = this.farmers.filter((f) => f.id !== farmer.id);
          this.cdr.markForCheck();
        })
        .catch(() => alert('Could not remove member.'));
    }
  }
}
