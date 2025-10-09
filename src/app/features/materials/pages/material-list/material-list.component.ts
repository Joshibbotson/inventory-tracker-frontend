import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialsService } from '../../services/materials.service';
import { Material, MaterialCategory } from '../../models/material.model';
import { Pagination } from '../../../../core/types/Pagination';
import { PaginationFooterComponent } from '../../../../core/components/pagination-footer/pagination-footer.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StockLevel } from '../../enums/StockLevel.enum';
import { SnakeToTitlePipe } from '../../../../core/pipes/snake-to-title.pipe';
import { IsLowStockPipe } from '../../pipes/is-low-stock.pipe';
import { MaterialListStats } from '../../types/MaterialListStats';

@Component({
  selector: 'app-material-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PaginationFooterComponent,
    SnakeToTitlePipe,
    IsLowStockPipe,
  ],
  templateUrl: './material-list.component.html',
  styles: [],
})
export class MaterialListComponent implements OnInit {
  private materialsService = inject(MaterialsService);
  private readonly destroyRef = inject(DestroyRef);

  materials = signal<Material[]>([]);
  materialStats = signal<MaterialListStats>({
    totalMaterials: 0,
    totalInventoryValue: 0,
    lowStockItems: 0,
  });
  lowStockMaterials = signal<Material[]>([]);
  loading = signal(true);
  pagination = signal<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  searchQuery = signal('');

  searchTerm = '';
  selectedCategory: MaterialCategory | '' = '';
  stockFilter: StockLevel | '' = '';
  StockLevel = StockLevel;

  search = new Subject<string>();
  filterChange = new Subject<void>();

  ngOnInit() {
    this.loadMaterials();
    this.initSearchListener();
    this.initFilterListener();
  }

  initSearchListener(): void {
    this.search
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe({
        next: (searchTerm) => {
          this.searchTerm = searchTerm;
          this.loadMaterials(1); // Reset to page 1 on search
        },
        error: (err) => {
          console.error('Search error:', err);
        },
      });
  }

  initFilterListener(): void {
    this.filterChange
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(100))
      .subscribe({
        next: () => {
          this.loadMaterials(1); // Reset to page 1 on filter change
        },
      });
  }

  resetFilters() {
    this.searchTerm = '';
    this.searchQuery.set('');
    this.selectedCategory = '';
    this.stockFilter = '';
    this.loadMaterials(1);
  }

  // Helper to check if any filters are active
  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedCategory || this.stockFilter);
  }

  handleSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.search.next(value);
  }

  onCategoryChange() {
    this.filterChange.next();
  }

  onStockFilterChange() {
    this.filterChange.next();
  }

  loadMaterials(page = 1) {
    this.loading.set(true);

    const opts: {
      searchTerm?: string;
      category?: MaterialCategory;
      stockLevel?: StockLevel;
    } = {};

    if (this.searchTerm) {
      opts.searchTerm = this.searchTerm;
    }

    if (this.selectedCategory) {
      opts.category = this.selectedCategory as MaterialCategory;
    }

    if (this.stockFilter) {
      opts.stockLevel = this.stockFilter as StockLevel;
    }

    this.materialsService
      .getMaterials(page, this.pagination().pageSize, opts)
      .subscribe({
        next: (res) => {
          this.materials.set(res.data);
          this.materialStats.set(res.materialStats);
          this.pagination.set({
            page: res.page,
            pageSize: res.pageSize,
            total: res.total,
          });
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading materials:', error);
          this.loading.set(false);
        },
      });
  }

  isLowStock(material: Material): boolean {
    return material.currentStock <= material.minimumStock;
  }

  // updateLowStockList(materials: Material[]) {
  //   const lowStock = materials.filter((m) => this.isLowStock(m));
  //   this.lowStockMaterials.set(lowStock);
  // }

  // calculateTotalValue(): number {
  //   return this.materials().reduce(
  //     (total, m) => total + m.currentStock * m.averageCost,
  //     0
  //   );
  // }

  adjustStock(material: Material, adjustment: number) {
    this.materialsService
      .adjustStock(material._id, {
        quantity: Math.abs(adjustment),
        type: adjustment > 0 ? 'increase' : 'decrease',
        notes: 'Quick adjustment from materials list',
      })
      .subscribe({
        next: () => {
          this.loadMaterials(this.pagination().page);
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
          this.loadMaterials(this.pagination().page);
        },
        error: (error) => {
          console.error('Error deleting material:', error);
          alert(`Failed to delete material: ${error.error.message}`);
        },
      });
    }
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.pagination.update((p) => ({ ...p, page }));
    this.loadMaterials(page);
  }

  totalPages(): number {
    const total = this.pagination().total;
    const pageSize = this.pagination().pageSize;
    return Math.ceil(total / pageSize);
  }

  changePageSize(newSize: number) {
    this.pagination.update((p) => ({
      ...p,
      pageSize: newSize,
      page: 1,
    }));
    this.loadMaterials(1);
  }
}
