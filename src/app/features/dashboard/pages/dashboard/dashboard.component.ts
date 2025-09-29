import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Material } from '../../../materials/models/material.model';
import { MaterialsService } from '../../../materials/services/materials.service';
import { Product } from '../../../products/models/product.model';
import { ProductsService } from '../../../products/services/products.service';
import { SalesService } from '../../../sales/services/sales.service';

interface DashboardStats {
  todaySales: number;
  todayRevenue: number;
  weekSales: number;
  weekRevenue: number;
  monthSales: number;
  monthRevenue: number;
  totalMaterials: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
}

interface TopProduct {
  product: Product;
  quantity: number;
  revenue: number;
}

interface SalesChartData {
  date: string;
  sales: number;
  revenue: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styles: [],
})
export class DashboardComponent implements OnInit {
  private salesService = inject(SalesService);
  private materialsService = inject(MaterialsService);
  private productsService = inject(ProductsService);

  loading = signal(true);
  stats = signal<DashboardStats>({
    todaySales: 0,
    todayRevenue: 0,
    weekSales: 0,
    weekRevenue: 0,
    monthSales: 0,
    monthRevenue: 0,
    totalMaterials: 0,
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalInventoryValue: 0,
  });

  topProducts = signal<TopProduct[]>([]);
  lowStockMaterials = signal<Material[]>([]);
  outOfStockMaterials = signal<Material[]>([]);
  salesChartData = signal<SalesChartData[]>([]);

  selectedPeriod = 'week';

  maxRevenue = computed(() => {
    const data = this.salesChartData();
    if (data.length === 0) return 1;
    return Math.max(...data.map((d) => d.revenue));
  });

  ngOnInit() {
    this.loadDashboardData();
  }

  async loadDashboardData() {
    this.loading.set(true);

    try {
      // Load all data in parallel
      const [salesSummary, materialsStats, materials, products] =
        await Promise.all([
          this.salesService.getSalesSummary().toPromise(),
          this.materialsService.getMaterialsStatistics().toPromise(),
          this.materialsService.getMaterials().toPromise(),
          this.productsService.getProducts().toPromise(),
        ]);

      // Process materials for low stock
      const lowStock =
        materials?.filter(
          (m) => m.currentStock > 0 && m.currentStock <= m.minimumStock
        ) || [];
      const outOfStock = materials?.filter((m) => m.currentStock === 0) || [];

      this.lowStockMaterials.set(lowStock);
      this.outOfStockMaterials.set(outOfStock);

      // Update stats
      if (salesSummary && materialsStats) {
        this.stats.set({
          todaySales: salesSummary.todaySales || 0,
          todayRevenue: salesSummary.todayRevenue || 0,
          weekSales: salesSummary.weekSales || 0,
          weekRevenue: salesSummary.weekRevenue || 0,
          monthSales: salesSummary.monthSales || 0,
          monthRevenue: salesSummary.monthRevenue || 0,
          totalMaterials: materialsStats.totalMaterials || 0,
          totalProducts: products?.length || 0,
          lowStockCount: materialsStats.lowStockCount || 0,
          outOfStockCount: materialsStats.outOfStockCount || 0,
          totalInventoryValue: materialsStats.totalValue || 0,
        });

        // Set top products
        if (salesSummary.topProducts) {
          this.topProducts.set(salesSummary.topProducts);
        }
      }

      // Generate chart data
      this.generateChartData();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  generateChartData() {
    // Generate sample data based on selected period
    const data: SalesChartData[] = [];
    const days =
      this.selectedPeriod === 'today'
        ? 24
        : this.selectedPeriod === 'week'
        ? 7
        : 30;

    const now = new Date();

    if (this.selectedPeriod === 'today') {
      // Hourly data for today
      for (let i = 0; i < 24; i++) {
        data.push({
          date: `${i}:00`,
          sales: Math.floor(Math.random() * 5),
          revenue: Math.random() * 200,
        });
      }
    } else {
      // Daily data for week/month
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        data.push({
          date: date.toISOString(),
          sales: Math.floor(Math.random() * 10),
          revenue: Math.random() * 500,
        });
      }
    }

    this.salesChartData.set(data);
  }

  formatChartDate(dateStr: string): string {
    if (this.selectedPeriod === 'today') {
      return dateStr; // Already formatted as hour
    }

    const date = new Date(dateStr);
    if (this.selectedPeriod === 'week') {
      return date.toLocaleDateString('en-GB', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      });
    }
  }

  onPeriodChange() {
    this.generateChartData();
  }

  refreshData() {
    this.loadDashboardData();
  }
}
