import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialsService } from '../../services/materials.service';
import { Material } from '../../models/material.model';

@Component({
  selector: 'app-material-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './material-list.component.html',
  styles: [],
})
export class MaterialListComponent implements OnInit {
  private materialsService = inject(MaterialsService);

  materials = signal<Material[]>([]);
  filteredMaterials = signal<Material[]>([]);
  lowStockMaterials = signal<Material[]>([]);
  loading = signal(true);

  searchTerm = '';
  selectedCategory = '';
  stockFilter = '';

  ngOnInit() {
    this.loadMaterials();
  }

  loadMaterials() {
    this.loading.set(true);
    this.materialsService.getMaterials().subscribe({
      next: (materials) => {
        this.materials.set(materials);
        this.filteredMaterials.set(materials);
        this.updateLowStockList(materials);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading materials:', error);
        this.loading.set(false);
      },
    });
  }

  filterMaterials() {
    let filtered = this.materials();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.sku.toLowerCase().includes(term) ||
          m.supplier?.toLowerCase().includes(term)
      );
    }

    if (this.selectedCategory) {
      filtered = filtered.filter((m) => m.category === this.selectedCategory);
    }

    if (this.stockFilter) {
      switch (this.stockFilter) {
        case 'low':
          filtered = filtered.filter(
            (m) => this.isLowStock(m) && m.currentStock > 0
          );
          break;
        case 'out':
          filtered = filtered.filter((m) => m.currentStock === 0);
          break;
        case 'ok':
          filtered = filtered.filter((m) => !this.isLowStock(m));
          break;
      }
    }

    this.filteredMaterials.set(filtered);
  }

  isLowStock(material: Material): boolean {
    return material.currentStock <= material.minimumStock;
  }

  updateLowStockList(materials: Material[]) {
    const lowStock = materials.filter((m) => this.isLowStock(m));
    this.lowStockMaterials.set(lowStock);
  }

  calculateTotalValue(): number {
    return this.materials().reduce(
      (total, m) => total + m.currentStock * m.averageCost,
      0
    );
  }

  adjustStock(material: Material, adjustment: number) {
    this.materialsService
      .adjustStock(material._id, {
        quantity: Math.abs(adjustment),
        type: adjustment > 0 ? 'increase' : 'decrease',
        notes: 'Quick adjustment from materials list',
      })
      .subscribe({
        next: () => {
          this.loadMaterials();
        },
        error: (error) => {
          console.error('Error adjusting stock:', error);
          alert('Failed to adjust stock. Please try again.');
        },
      });
  }

  deleteMaterial(material: Material) {
    if (confirm(`Are you sure you want to delete "${material.name}"?`)) {
      this.materialsService.deleteMaterial(material._id).subscribe({
        next: () => {
          this.loadMaterials();
        },
        error: (error) => {
          console.error('Error deleting material:', error);
          alert('Failed to delete material. Please try again.');
        },
      });
    }
  }
}
