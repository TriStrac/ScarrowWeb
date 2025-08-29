import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-farmers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './farmers.html',
  styleUrls: ['./farmers.css']
})
export class FarmersComponent {
  searchTerm: string = '';

  farmers = [
    { id: 1, name: 'Hirono', deviceCount: 12, activeDeviceCount: 10 },
    { id: 2, name: 'Kelly', deviceCount: 10, activeDeviceCount: 10 },
    { id: 3, name: 'Leigh', deviceCount: 8, activeDeviceCount: 5 },
    { id: 4, name: 'Namie', deviceCount: 9, activeDeviceCount: 7 }
  ];

  constructor(private router: Router) {}

  filteredFarmers() {
    if (!this.searchTerm) return this.farmers;
    return this.farmers.filter(farmer =>
      farmer.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  addFarmer() {
    const newId = this.farmers.length + 1;
    this.farmers.push({
      id: newId,
      name: `Farmer ${newId}`,
      deviceCount: Math.floor(Math.random() * 15) + 1,
      activeDeviceCount: Math.floor(Math.random() * 10) + 1
    });
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
