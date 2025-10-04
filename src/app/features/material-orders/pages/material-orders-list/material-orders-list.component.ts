// material-orders-list.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Material } from '../../../materials/models/material.model';
import { MaterialsService } from '../../../materials/services/materials.service';
import {
  MaterialOrderService,
  MaterialOrder,
} from '../../services/material-order.service';
import { PaginationFooterComponent } from '../../../../core/components/pagination-footer/pagination-footer.component';
import { Pagination } from '../../../../core/types/Pagination';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-material-orders-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaginationFooterComponent],
  templateUrl: './material-orders-list.component.html',
  styles: [],
})
export class MaterialOrdersListComponent implements OnInit {
  private orderService = inject(MaterialOrderService);
  private materialsService = inject(MaterialsService);

  orders = signal<MaterialOrder[]>([]);
  filteredOrders = signal<MaterialOrder[]>([]);
  materials = signal<Material[]>([]);
  selectedOrder = signal<MaterialOrder | null>(null);
  loading = signal(true);
  pagination = signal<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  searchQuery = signal('');

  selectedMaterial = '';
  startDate = '';
  endDate = '';

  ngOnInit() {
    this.loadData();
  }

  async loadData(page = 1) {
    this.loading.set(true);

    forkJoin({
      orders: this.orderService.getOrders(
        this.pagination().page,
        this.pagination().pageSize
      ),
      materials: this.materialsService.getMaterials(), // gonna have to make this a typeahead swiftly
    }).subscribe({
      next: (res) => {
        this.orders.set(res.orders.data || []);
        this.filteredOrders.set(res.orders.data || []);
        this.materials.set(res.materials?.data || []);
        this.pagination.set({
          page: res.orders.page,
          pageSize: res.orders.pageSize,
          total: res.orders.total,
        });
      },
      error: (err) => {
        console.error('Error loading data:', err);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  filterOrders() {
    let filtered = this.orders();

    if (this.selectedMaterial) {
      filtered = filtered.filter((order) => {
        const materialId =
          typeof order.material === 'object'
            ? order.material._id
            : order.material;
        return materialId === this.selectedMaterial;
      });
    }

    if (this.startDate) {
      const start = new Date(this.startDate);
      filtered = filtered.filter(
        (order) => new Date(order.createdAt!) >= start
      );
    }

    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((order) => new Date(order.createdAt!) <= end);
    }

    this.filteredOrders.set(filtered);
  }

  calculateTotalSpent(): number {
    return this.filteredOrders().reduce(
      (sum, order) => sum + order.totalCost,
      0
    );
  }

  calculateTotalUnits(): number {
    return this.filteredOrders().reduce(
      (sum, order) => sum + order.quantity,
      0
    );
  }

  calculateAverageOrderValue(): number {
    const orders = this.filteredOrders();
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
      `Note: This will not adjust stock levels.`;

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

  exportOrders() {
    const headers = [
      'Date',
      'Material',
      'SKU',
      'Quantity',
      'Unit Cost',
      'Total Cost',
      'Supplier',
      'Notes',
    ];
    const rows = this.filteredOrders().map((order) => [
      this.formatDate(order.createdAt),
      this.getMaterialName(order.material),
      this.getMaterialSku(order.material),
      order.quantity.toString(),
      order.unitCost?.toFixed(2) || '0',
      order.totalCost.toFixed(2),
      order.supplier || '',
      order.notes || '',
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach((row) => {
      csv += row.map((cell) => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `material-orders-${
      new Date().toISOString().split('T')[0]
    }.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
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
