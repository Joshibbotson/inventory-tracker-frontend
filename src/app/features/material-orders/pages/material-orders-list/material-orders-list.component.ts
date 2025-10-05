import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Material } from '../../../materials/models/material.model';
import {
  MaterialOrderService,
  MaterialOrder,
} from '../../services/material-order.service';
import { PaginationFooterComponent } from '../../../../core/components/pagination-footer/pagination-footer.component';
import { Pagination } from '../../../../core/types/Pagination';
import { MaterialSearchComponent } from '../../../materials/components/material-search/material-search.component';

@Component({
  selector: 'app-material-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PaginationFooterComponent,
    MaterialSearchComponent,
  ],
  templateUrl: './material-orders-list.component.html',
  styles: [],
})
export class MaterialOrdersListComponent implements OnInit {
  private orderService = inject(MaterialOrderService);

  orders = signal<MaterialOrder[]>([]);
  materials = signal<Material[]>([]);
  selectedOrder = signal<MaterialOrder | null>(null);
  loading = signal(true);
  pagination = signal<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  searchQuery = signal('');

  selectedMaterial?: string;
  startDate = '';
  endDate = '';

  ngOnInit() {
    this.loadData();
  }

  async loadData(page = 1) {
    this.loading.set(true);
    this.orderService
      .getOrders(this.pagination().page, this.pagination().pageSize, {
        materialId: this.selectedMaterial,
        startDate: this.startDate,
        endDate: this.endDate,
      })
      .subscribe({
        next: (res) => {
          this.orders.set(res.data || []);
          this.pagination.set({
            page: res.page,
            pageSize: res.pageSize,
            total: res.total,
          });
        },
        error: (err) => {
          console.error('Error loading data:', err);
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
  }

  calculateTotalSpent(): number {
    return this.orders().reduce((sum, order) => sum + order.totalCost, 0);
  }

  calculateTotalUnits(): number {
    return this.orders().reduce((sum, order) => sum + order.quantity, 0);
  }

  calculateAverageOrderValue(): number {
    const orders = this.orders();
    if (orders.length === 0) return 0;
    return this.calculateTotalSpent() / orders.length;
  }

  getMaterialName(material: any): string {
    if (typeof material === 'object' && material?.name) {
      return material.name;
    }
    return 'Unknown Material';
  }

  getMaterialSku(material: any): string {
    if (typeof material === 'object' && material?.sku) {
      return material.sku;
    }
    return '-';
  }

  getMaterialUnit(material: any): string {
    if (typeof material === 'object' && material?.unit) {
      if (typeof material.unit === 'object' && material.unit.abbreviation) {
        return material.unit.abbreviation;
      }
    }
    return '';
  }

  handleSelectedMaterial(material: Material | undefined): void {
    this.selectedMaterial = material?._id;
    this.loadData(1);
  }

  handleDateChange(filter: 'startDate' | 'endDate', value: string): void {
    switch (filter) {
      case 'startDate':
        this.startDate = value;
        break;
      case 'endDate':
        this.endDate = value;
        break;
    }
    this.loadData(1);
  }

  formatDate(date: any): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  viewOrderDetails(order: MaterialOrder) {
    this.selectedOrder.set(order);
  }

  deleteOrder(order: MaterialOrder) {
    if (!order._id) return;

    const confirmMessage =
      `Are you sure you want to delete this order?\n\n` +
      `Material: ${this.getMaterialName(order.material)}\n` +
      `Quantity: ${order.quantity}\n` +
      `Total Cost: £${order.totalCost.toFixed(2)}\n\n` +
      `Note: This will adjust stock levels.`;

    if (confirm(confirmMessage)) {
      this.orderService.deleteOrder(order._id).subscribe({
        next: () => {
          this.selectedOrder.set(null);
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting order:', error);
          alert('Failed to delete order. Stock may have already been used.');
        },
      });
    }
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedMaterial || this.startDate || this.endDate);
  }

  clearFilters(): void {
    this.selectedMaterial = undefined;
    this.startDate = '';
    this.endDate = '';
    this.loadData(1);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.pagination.update((p) => ({ ...p, page }));
    this.loadData(page);
  }

  /**
   * Calculate total number of pages
   */
  totalPages(): number {
    const total = this.pagination().total;
    const pageSize = this.pagination().pageSize;
    return Math.ceil(total / pageSize);
  }

  /**
   * Change page size (items per page)
   */
  changePageSize(newSize: number) {
    this.pagination.update((p) => ({
      ...p,
      pageSize: newSize,
      page: 1, // Reset to first page when changing page size
    }));
    this.loadData(1);
  }
}
