import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Sale } from '../../models/Sale.model';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './sales-history.component.html',
  styles: [],
})
export class SalesHistoryComponent implements OnInit {
  private salesService = inject(SalesService);

  sales = signal<Sale[]>([]);
  filteredSales = signal<Sale[]>([]);
  selectedSale = signal<Sale | null>(null);
  loading = signal(true);

  startDate = '';
  endDate = '';

  ngOnInit() {
    // Set default date range to current month
    this.setDateRange('month');
    this.loadSales();
  }

  loadSales() {
    this.loading.set(true);

    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999); // Include entire end day

      this.salesService.getSalesByDateRange(start, end).subscribe({
        next: (sales) => {
          this.sales.set(sales);
          this.filteredSales.set(sales);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading sales:', error);
          this.loading.set(false);
        },
      });
    } else {
      this.salesService.getSales().subscribe({
        next: (sales) => {
          this.sales.set(sales);
          this.filteredSales.set(sales);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading sales:', error);
          this.loading.set(false);
        },
      });
    }
  }

  filterSales() {
    this.loadSales();
  }

  setDateRange(range: 'today' | 'week' | 'month') {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    switch (range) {
      case 'today':
        this.startDate = `${year}-${month}-${day}`;
        this.endDate = `${year}-${month}-${day}`;
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekStartStr = `${weekStart.getFullYear()}-${String(
          weekStart.getMonth() + 1
        ).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        this.startDate = weekStartStr;
        this.endDate = `${year}-${month}-${day}`;
        break;
      case 'month':
        this.startDate = `${year}-${month}-01`;
        this.endDate = `${year}-${month}-${day}`;
        break;
    }

    this.loadSales();
  }

  calculateTotalRevenue(): number {
    return this.filteredSales().reduce(
      (total, sale) => total + sale.totalPrice,
      0
    );
  }

  calculateAverageSale(): number {
    const sales = this.filteredSales();
    if (sales.length === 0) return 0;
    return this.calculateTotalRevenue() / sales.length;
  }

  calculateTotalItems(): number {
    return this.filteredSales().reduce(
      (total, sale) => total + sale.quantity,
      0
    );
  }

  formatDate(date: any): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getProductName(product: any): string {
    if (typeof product === 'object' && product?.name) {
      return product.name;
    }
    return 'Unknown Product';
  }

  getProductSku(product: any): string {
    if (typeof product === 'object' && product?.sku) {
      return product.sku;
    }
    return '-';
  }

  getUserName(user: any): string {
    if (typeof user === 'object' && user) {
      if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
      }
      if (user.email) {
        return user.email;
      }
    }
    return 'System';
  }

  viewSaleDetails(sale: Sale) {
    this.selectedSale.set(sale);
  }

  exportSales() {
    // Convert sales to CSV
    const headers = [
      'Date',
      'Product',
      'SKU',
      'Quantity',
      'Total',
      'Sold By',
      'Notes',
    ];
    const rows = this.filteredSales().map((sale) => [
      this.formatDate(sale.createdAt),
      this.getProductName(sale.product),
      this.getProductSku(sale.product),
      sale.quantity.toString(),
      sale.totalPrice.toFixed(2),
      this.getUserName(sale.soldBy),
      sale.notes || '',
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach((row) => {
      csv += row.map((cell) => `"${cell}"`).join(',') + '\n';
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-${this.startDate}-to-${this.endDate}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
