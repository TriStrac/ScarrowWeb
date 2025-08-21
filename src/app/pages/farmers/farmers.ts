import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-farmers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './farmers.html',
  styleUrls: ['./farmers.css']
})
export class FarmersComponent {
  // ✅ Search input binding
  searchTerm: string = '';

  // ✅ Farmers list (table data)
  farmers = [
    { id: 1, name: 'Hirono', deviceCount: 12, activeDeviceCount: 10 },
    { id: 2, name: 'Kelly', deviceCount: 10, activeDeviceCount: 10 },
    { id: 3, name: 'Leigh', deviceCount: 8, activeDeviceCount: 5 },
    { id: 4, name: 'Namie', deviceCount: 9, activeDeviceCount: 7 }
  ];

  // ✅ Filtered list based on search term
  filteredFarmers() {
    if (!this.searchTerm) return this.farmers;
    return this.farmers.filter(farmer =>
      farmer.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // ✅ Add new farmer (demo)
  addFarmer() {
    const newId = this.farmers.length + 1;
    this.farmers.push({
      id: newId,
      name: `Farmer ${newId}`,
      deviceCount: Math.floor(Math.random() * 15) + 1,
      activeDeviceCount: Math.floor(Math.random() * 10) + 1
    });
  }

  // ✅ Edit farmer (demo action)
  editFarmer(farmer: any) {
    alert(`Editing farmer: ${farmer.name}`);
  }

  // ✅ Delete farmer
  deleteFarmer(farmer: any) {
    if (confirm(`Are you sure you want to delete ${farmer.name}?`)) {
      this.farmers = this.farmers.filter(f => f.id !== farmer.id);
    }
  }
}
